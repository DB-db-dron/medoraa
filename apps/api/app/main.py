from fastapi import FastAPI, HTTPException, Depends, status, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
import datetime
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import JWTError, jwt
from supabase import create_client
import logging

# Load environment variables from .env file
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI()


# CORS
origins = [o for o in ("http://localhost:3000", os.getenv("WEBDOMAIN")) if o]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register AuthMiddleware to protect configured prefixes
from .middleware import AuthMiddleware

PROTECTED_PREFIXES = ["/patients", "/hospitals", "/bookings", "/api"]
app.add_middleware(AuthMiddleware, protected_prefixes=PROTECTED_PREFIXES)


# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Optional[Any] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logger.exception("Failed to create Supabase client: %s", e)
        supabase = None
else:
    logger.warning("SUPABASE_URL / SUPABASE_KEY not set; supabase client not configured")


# Auth / security
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-prod")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- Pydantic schemas ---
class PatientRegister(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str


class HospitalRegister(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PublicUser(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[str] = None


# --- Helpers ---
def _extract_data(resp: Any) -> List[Dict[str, Any]]:
    """
    Normalize supabase-py responses:
    - dict with 'data'
    - object with .data
    - return [] on error/None
    """
    if resp is None:
        return []
    if isinstance(resp, dict):
        data = resp.get("data")
        if data is None:
            # check for error
            err = resp.get("error")
            if err:
                logger.debug("Supabase returned error: %s", err)
            return []
        return data or []
    # object-like
    data = getattr(resp, "data", None)
    if data is None:
        # sometimes supabase returns { "data": None, "error": ... }
        err = getattr(resp, "error", None)
        if err:
            logger.debug("Supabase returned error object: %s", err)
        return []
    return data or []


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    # Use timezone-aware UTC datetime for expiration
    to_encode: Dict[str, Any] = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=expires_minutes)
    # jose accepts datetime for exp
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    if not supabase:
        raise RuntimeError("Supabase client not configured (SUPABASE_URL / SUPABASE_KEY missing)")
    try:
        # try patients
        res = supabase.table("patients").select("*").eq("email", email).limit(1).execute()
        rows = _extract_data(res)
        if rows:
            u = rows[0]
            u["__role"] = "patient"
            return u
        # try hospitals
        res = supabase.table("hospitals").select("*").eq("email", email).limit(1).execute()
        rows = _extract_data(res)
        if rows:
            u = rows[0]
            u["__role"] = "hospital"
            return u
    except Exception as e:
        logger.exception("Error querying supabase for email %s: %s", email, e)
        raise RuntimeError("Database query failed")
    return None


def get_user_by_id_and_role(user_id: str, role: str) -> Optional[Dict[str, Any]]:
    if not supabase:
        raise RuntimeError("Supabase client not configured")
    table = "patients" if role == "patient" else "hospitals"
    try:
        res = supabase.table(table).select("*").eq("id", user_id).limit(1).execute()
        rows = _extract_data(res)
        return rows[0] if rows else None
    except Exception as e:
        logger.exception("Error fetching user %s from %s: %s", user_id, table, e)
        raise RuntimeError("Database query failed")


# --- Auth dependency ---
async def get_current_user(request: Request) -> Dict[str, Any]:
    # If middleware attached a validated user, prefer it (cookie or header handled by middleware)
    user = getattr(request.state, "user", None)
    role = getattr(request.state, "role", None)
    if user and role:
        return {"user": user, "role": role}

    # Fallback: accept Authorization header or cookie
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    token = None
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
    else:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        role: Optional[str] = payload.get("role")
        if not user_id or not role:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    try:
        user = get_user_by_id_and_role(user_id, role)
    except RuntimeError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="DB error")
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.pop("password_hash", None)
    return {"user": user, "role": role}


# --- Routes: Registration / Login ---
@app.post("/auth/patient/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def register_patient(payload: PatientRegister):
    if not supabase:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase not configured")
    try:
        if find_user_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    except RuntimeError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="DB error")
    hashed = get_password_hash(payload.password)
    insert = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "password_hash": hashed
    }
    try:
        res = supabase.table("patients").insert(insert).execute()
    except Exception as e:
        logger.exception("Failed to insert patient: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create patient")
    rows = _extract_data(res)
    if not rows:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create patient")
    user = rows[0]
    user.pop("password_hash", None)
    return {"status": "ok", "user": user}


@app.post("/auth/hospital/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def register_hospital(payload: HospitalRegister):
    if not supabase:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase not configured")
    try:
        if find_user_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    except RuntimeError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="DB error")
    hashed = get_password_hash(payload.password)
    insert = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "address": payload.address,
        "password_hash": hashed
    }
    try:
        res = supabase.table("hospitals").insert(insert).execute()
    except Exception as e:
        logger.exception("Failed to insert hospital: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create hospital")
    rows = _extract_data(res)
    if not rows:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create hospital")
    user = rows[0]
    user.pop("password_hash", None)
    return {"status": "ok", "user": user}


@app.post("/auth/login", response_model=TokenResponse)
async def login(req: LoginRequest, response: Response):
    if not supabase:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase not configured")
    try:
        user = find_user_by_email(req.email)
    except RuntimeError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="DB error")
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credentials")
    hashed = user.get("password_hash")
    if not hashed or not verify_password(req.password, hashed):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credentials")
    role = user.get("__role", "patient")
    user_id = user.get("id")
    token = create_access_token({"sub": user_id, "role": role})

    # set JWT as HttpOnly cookie (used by browser clients)
    secure_cookie = True if os.getenv("ENV") == "production" else False
    max_age = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=max_age,
        path="/",
    )

    return {"access_token": token, "token_type": "bearer"}


# --- Protected example routes ---
@app.get("/patients/me", response_model=PublicUser)
async def patients_me(current: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current["role"] != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a patient token")
    return current["user"]


@app.get("/hospitals/me", response_model=PublicUser)
async def hospitals_me(current: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current["role"] != "hospital":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a hospital token")
    return current["user"]


# health/greet endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/greet/{name}")
async def greet(name: str):
    return {"message": f"How are u, {name}!"}
 

@app.get("/doctors")
async def get_doctors():
    """Return a public list of doctors from the database for frontend consumption."""
    if not supabase:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase not configured")
    try:
        res = supabase.table("doctors").select("*").execute()
        rows = _extract_data(res)
        return rows
    except Exception as e:
        logger.exception("Failed to fetch doctors: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch doctors")


@app.get("/bookings")
async def get_bookings():
    """Return list of bookings. For dev it returns booking rows from Supabase if available, otherwise sample data."""
    sample = [
        {"time": "09:00 AM", "patient": "John Smith", "doctor": "Dr. Sarah Johnson", "type": "Cardiology Consultation", "status": "Confirmed"},
        {"time": "10:30 AM", "patient": "Emily Davis", "doctor": "Dr. Michael Chen", "type": "Dermatology Checkup", "status": "In Progress"},
        {"time": "02:00 PM", "patient": "Robert Wilson", "doctor": "Dr. Emily Rodriguez", "type": "Pediatric Consultation", "status": "Waiting"},
        {"time": "03:30 PM", "patient": "Lisa Thompson", "doctor": "Dr. Sarah Johnson", "type": "Follow-up Visit", "status": "Confirmed"},
    ]

    if not supabase:
        return sample
    try:
        res = supabase.table("bookings").select("*").order("start_time", {"ascending": True}).execute()
        rows = _extract_data(res)
        # Map supabase rows into the frontend-friendly shape if needed
        mapped = []
        for r in rows:
            mapped.append({
                "time": r.get("start_time") or r.get("time") or "",
                "patient": r.get("patient_name") or r.get("patient") or "",
                "doctor": r.get("doctor_name") or r.get("doctor") or "",
                "type": r.get("type") or r.get("reason") or "",
                "status": r.get("status") or "",
            })
        return mapped
    except Exception as e:
        logger.exception("Failed to fetch bookings: %s", e)
        return sample


@app.post("/auth/logout")
async def logout(response: Response):
    # Clear the access_token cookie so browser sessions are logged out
    response.delete_cookie(key="access_token", path="/")
    return {"status": "ok"}
 

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)