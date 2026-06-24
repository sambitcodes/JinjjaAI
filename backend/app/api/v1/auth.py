from datetime import timedelta
import asyncio
import uuid
import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
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
from backend.app.models.user import User, Profile, LoginEvent
from backend.app.schemas.auth import UserRegister, UserLogin, Token, TokenPayload, UserResponse
from backend.app.schemas.user import UserFullResponse
from backend.app.services.email_service import send_login_alert

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def _get_client_ip(request: Request) -> str:
    """Extract real client IP, handling proxies."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def _record_event(
    user_id: uuid.UUID,
    email: str,
    event_type: str,
    method: str,
    ip_address: str,
    user_agent: str,
):
    """
    Write a LoginEvent row in its own DB session.
    Completely isolated from the main request session — won't break login if it fails.
    """
    from backend.app.core.database import async_session_factory
    try:
        async with async_session_factory() as db:
            event = LoginEvent(
                user_id=user_id,
                email=email,
                event_type=event_type,
                method=method,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            db.add(event)
            await db.commit()
            print(f"[ADMIN] ✓ Event recorded: {event_type} / {method} for {email}", flush=True)
    except Exception as e:
        print(f"[ADMIN] ✗ Failed to record event: {e}", flush=True)


async def _send_email_alert(
    event_type: str,
    method: str,
    email: str,
    display_name: str | None,
    ip_address: str,
    user_agent: str,
    user_id: str,
    profile_info: dict | None,
):
    """Send email alert — errors are caught and logged, never propagate."""
    try:
        await send_login_alert(
            event_type=event_type,
            method=method,
            email=email,
            display_name=display_name,
            ip_address=ip_address,
            user_agent=user_agent,
            user_id=user_id,
            profile_info=profile_info,
        )
    except Exception as e:
        print(f"[EMAIL] ✗ Alert failed: {e}", flush=True)


def _schedule_tracking(
    background_tasks: BackgroundTasks,
    user: User,
    event_type: str,
    method: str,
    ip: str,
    ua: str,
):
    """
    Schedule both DB recording and email alert as FastAPI background tasks.
    Uses BackgroundTasks (reliable) instead of asyncio.create_task.
    Neither task will ever break or delay the login response.
    """
    profile_info = None
    if hasattr(user, "profile") and user.profile:
        p = user.profile
        profile_info = {
            "korean_name": p.korean_name,
            "native_language": p.native_language,
            "korean_proficiency": p.korean_proficiency,
            "study_reason": p.study_reason,
            "occupation": p.occupation,
            "total_xp": p.total_xp,
            "current_streak": p.current_streak,
        }

    background_tasks.add_task(
        _record_event,
        user_id=user.id,
        email=user.email,
        event_type=event_type,
        method=method,
        ip_address=ip,
        user_agent=ua,
    )
    background_tasks.add_task(
        _send_email_alert,
        event_type=event_type,
        method=method,
        email=user.email,
        display_name=user.profile.display_name if user.profile else None,
        ip_address=ip,
        user_agent=ua,
        user_id=str(user.id),
        profile_info=profile_info,
    )


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
    
    stmt = select(User).where(User.id == uuid.UUID(token_data.sub)).options(selectinload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserFullResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserRegister,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
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
    await db.flush()

    new_profile = Profile(
        user_id=new_user.id,
        display_name=user_in.display_name or user_in.email.split("@")[0],
        native_language=user_in.native_language,
    )
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_user)
    
    stmt = select(User).where(User.id == new_user.id).options(selectinload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()

    ip = _get_client_ip(request)
    ua = request.headers.get("User-Agent", "")
    _schedule_tracking(background_tasks, user, "signup", "password", ip, ua)

    return user

@router.post("/login", response_model=Token)
async def login(
    user_in: UserLogin,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    ip = _get_client_ip(request)
    ua = request.headers.get("User-Agent", "")

    # Local hack for Sambit
    if user_in.email == "sambit@hangeulai.com" and user_in.password == "12345678":
        stmt = select(User).where(User.email == "sambit@hangeulai.com").options(selectinload(User.profile))
        result = await db.execute(stmt)
        user = result.scalars().first()
        if not user:
            user = User(
                email="sambit@hangeulai.com",
                password_hash=get_password_hash("12345678"),
                role="user",
            )
            db.add(user)
            await db.flush()
            profile = Profile(
                user_id=user.id,
                display_name="Sambit",
                native_language="English",
                level_progress=1,
                total_xp=0,
                current_streak=0
            )
            db.add(profile)
            await db.commit()
            await db.refresh(user)
            stmt = select(User).where(User.id == user.id).options(selectinload(User.profile))
            result = await db.execute(stmt)
            user = result.scalars().first()
            
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(user.id, expires_delta=access_token_expires)
        refresh_token = create_refresh_token(user.id)
        _schedule_tracking(background_tasks, user, "login", "password", ip, ua)
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

    stmt = select(User).where(User.email == user_in.email).options(selectinload(User.profile))
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
    _schedule_tracking(background_tasks, user, "login", "password", ip, ua)
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

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
    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

@router.post("/google", response_model=dict)
async def google_login(
    payload: dict,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    id_token = payload.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="Missing Google ID token")
        
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}", timeout=5.0)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google ID token")
        info = resp.json()
        
    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google")
        
    stmt = select(User).where(User.email == email).options(selectinload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    ip = _get_client_ip(request)
    ua = request.headers.get("User-Agent", "")
    is_new_signup = False

    if not user:
        user = User(email=email, password_hash="", role="user")
        db.add(user)
        await db.flush()
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
        stmt = select(User).where(User.id == user.id).options(selectinload(User.profile))
        result = await db.execute(stmt)
        user = result.scalars().first()
        is_new_signup = True
        
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    event_type = "signup" if is_new_signup else "login"
    _schedule_tracking(background_tasks, user, event_type, "google", ip, ua)
    
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
