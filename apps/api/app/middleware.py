import os
import logging
from typing import Optional, Dict, Any, List

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from jose import jwt, JWTError
from supabase import create_client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-prod")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# default protected path prefixes (adjust as needed)
DEFAULT_PROTECTED_PREFIXES = ["/patients", "/hospitals", "/bookings", "/api"]


def _extract_data(resp: Any) -> List[Dict[str, Any]]:
    if resp is None:
        return []
    if isinstance(resp, dict):
        return resp.get("data") or []
    return getattr(resp, "data", []) or []


class AuthMiddleware(BaseHTTPMiddleware):
    """
    JWT + Supabase middleware.
    -fetches user from Supabase and sets request.state.user and request.state.role.
    """

    def __init__(self, app, protected_prefixes: Optional[List[str]] = None):
        super().__init__(app)
        self.protected_prefixes = protected_prefixes or DEFAULT_PROTECTED_PREFIXES
        self.supabase = None
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            except Exception as e:
                logger.exception("Failed to create Supabase client in middleware: %s", e)
                self.supabase = None
        else:
            logger.warning("Supabase env not set for middleware; DB calls will fail")

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path or ""
        # Skip middleware for non-protected paths
        if not any(path.startswith(p) for p in self.protected_prefixes):
            return await call_next(request)

        # prefer Authorization header, fall back to access_token cookie
        auth = request.headers.get("authorization") or request.headers.get("Authorization")
        token = None
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
        else:
            token = request.cookies.get("access_token")

        if not token:
            return JSONResponse({"detail": "Missing authorization token"}, status_code=401)
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            role = payload.get("role")
            if not user_id or not role:
                raise JWTError("Invalid token payload")
        except JWTError:
            return JSONResponse({"detail": "Invalid or expired token"}, status_code=401)

        # fetch user from supabase
        if not self.supabase:
            logger.error("Supabase client not configured in middleware")
            return JSONResponse({"detail": "Server DB not configured"}, status_code=500)

        table = "patients" if role == "patient" else "hospitals"
        try:
            res = self.supabase.table(table).select("*").eq("id", user_id).limit(1).execute()
            rows = _extract_data(res)
        except Exception as e:
            logger.exception("Supabase query failed in middleware: %s", e)
            return JSONResponse({"detail": "DB query error"}, status_code=500)

        if not rows:
            return JSONResponse({"detail": "User not found"}, status_code=404)

        user = rows[0]
        user.pop("password_hash", None)

        # attach to request.state for downstream handlers/dependencies
        request.state.user = user
        request.state.role = role

        return await call_next(request)
