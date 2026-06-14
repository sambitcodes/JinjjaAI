from datetime import timedelta
import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from backend.app.models.user import User, Profile
from backend.app.schemas.auth import UserRegister, UserLogin, Token, TokenPayload, UserResponse
from backend.app.schemas.user import UserFullResponse

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        if username is None or token_type != "access":
            raise credentials_exception
        token_data = TokenPayload(sub=username, type=token_type)
    except JWTError:
        raise credentials_exception
    
    # Query user with profile
    stmt = select(User).where(User.id == uuid.UUID(token_data.sub)).options(selectinload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserFullResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )
    
    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role="user",
    )
    db.add(new_user)
    await db.flush()  # To populate user ID

    new_profile = Profile(
        user_id=new_user.id,
        display_name=user_in.display_name or user_in.email.split("@")[0],
        native_language=user_in.native_language,
    )
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_user)
    
    # Reload user with profile relationship
    stmt = select(User).where(User.id == new_user.id).options(selectinload(User.profile))
    result = await db.execute(stmt)
    return result.scalars().first()

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(user.id, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
    )
    try:
        payload = jwt.decode(
            refresh_token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    stmt = select(User).where(User.id == uuid.UUID(user_id))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise credentials_exception
        
    access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }

@router.post("/google", response_model=dict)
async def google_login(payload: dict, db: AsyncSession = Depends(get_db)):
    id_token = payload.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="Missing Google ID token")
        
    async with httpx.AsyncClient() as client:
        # Validate ID Token with Google's API
        resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}", timeout=5.0)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google ID token")
        info = resp.json()
        
    # Extract email and name
    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google")
        
    # Check if user already exists
    stmt = select(User).where(User.email == email).options(selectinload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    is_new_signup = False
    if not user:
        # Create new user
        user = User(
            email=email,
            password_hash="", # Google auth users don't have password_hash
            role="user",
        )
        db.add(user)
        await db.flush()
        
        # Create empty profile that will be configured during onboarding
        profile = Profile(
            user_id=user.id,
            display_name=info.get("name") or email.split("@")[0],
            native_language="en",
            level_progress=1,
            total_xp=0,
            current_streak=0
        )
        db.add(profile)
        await db.commit()
        await db.refresh(user)
        is_new_signup = True
        
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "is_new_signup": is_new_signup
    }

@router.get("/me", response_model=UserFullResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.delete("/delete-account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.delete(current_user)
    await db.commit()
    return
