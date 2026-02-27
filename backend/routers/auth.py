from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from config import get_settings
import models
import schemas

router = APIRouter()
settings = get_settings()


def verify_token(authorization: str = Header(None)):
    """Simple token verification"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token provided")
    
    # Extract token from "Bearer <token>"
    try:
        token = authorization.split(" ")[1] if " " in authorization else authorization
    except:
        token = authorization
    
    if token != settings.access_token:
        raise HTTPException(status_code=401, detail="Invalid access token")
    
    return True


@router.post("/auth/verify")
async def verify_auth(auth_req: schemas.AuthRequest):
    """Verify access token"""
    if auth_req.access_token != settings.access_token:
        raise HTTPException(status_code=401, detail="Invalid access token")
    
    return {"message": "Authentication successful", "authenticated": True}
