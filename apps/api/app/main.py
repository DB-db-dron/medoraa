from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import JWTError, jwt
from supabase import create_client

# Load environment variables from .env file
load_dotenv()


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


# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# Auth / security
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-prod")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


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


# --- Helpers ---
def _extract_data(resp: Any):
    if resp is None:
        return []
    if isinstance(resp, dict):
        return resp.get("data") or []
    return getattr(resp, "data", []) or []


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    import datetime
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    if not supabase:
        raise RuntimeError("Supabase client not configured (SUPABASE_URL / SUPABASE_KEY missing)")
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
    return None


def get_user_by_id_and_role(user_id: str, role: str) -> Optional[Dict[str, Any]]:
    if not supabase:
        raise RuntimeError("Supabase client not configured")
    table = "patients" if role == "patient" else "hospitals"
    res = supabase.table(table).select("*").eq("id", user_id).limit(1).execute()
    rows = _extract_data(res)
    return rows[0] if rows else None


# --- Auth dependency ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if not user_id or not role:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    user = get_user_by_id_and_role(user_id, role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.pop("password_hash", None)
    return {"user": user, "role": role}


# --- Routes: Registration / Login ---
@app.post("/auth/patient/register")
async def register_patient(payload: PatientRegister):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    if find_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = get_password_hash(payload.password)
    insert = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "password_hash": hashed
    }
    res = supabase.table("patients").insert(insert).execute()
    rows = _extract_data(res)
    if not rows:
        raise HTTPException(status_code=500, detail="Failed to create patient")
    user = rows[0]
    user.pop("password_hash", None)
    return {"status": "ok", "user": user}


@app.post("/auth/hospital/register")
async def register_hospital(payload: HospitalRegister):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    if find_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = get_password_hash(payload.password)
    insert = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "address": payload.address,
        "password_hash": hashed
    }
    res = supabase.table("hospitals").insert(insert).execute()
    rows = _extract_data(res)
    if not rows:
        raise HTTPException(status_code=500, detail="Failed to create hospital")
    user = rows[0]
    user.pop("password_hash", None)
    return {"status": "ok", "user": user}


@app.post("/auth/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    user = find_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    hashed = user.get("password_hash")
    if not hashed or not verify_password(req.password, hashed):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    role = user.get("__role", "patient")
    user_id = user.get("id")
    token = create_access_token({"sub": user_id, "role": role})
    return {"access_token": token, "token_type": "bearer"}


# --- Protected example routes ---
@app.get("/patients/me")
async def patients_me(current=Depends(get_current_user)):
    if current["role"] != "patient":
        raise HTTPException(status_code=403, detail="Not a patient token")
    return current["user"]


@app.get("/hospitals/me")
async def hospitals_me(current=Depends(get_current_user)):
    if current["role"] != "hospital":
        raise HTTPException(status_code=403, detail="Not a hospital token")
    return current["user"]


# health/greet endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/greet/{name}")
async def greet(name: str):
    return {"message": f"How are u, {name}!"}
 

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)