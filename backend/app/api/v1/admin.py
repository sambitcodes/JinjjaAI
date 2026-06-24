"""
Admin Management API
Provides endpoints for the admin dashboard to view all users and login events.
Protected by ADMIN_SECRET header (not user JWT).
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from sqlalchemy.orm import selectinload
from typing import Optional
import csv
import io
from fastapi.responses import StreamingResponse

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.user import User, Profile, LoginEvent

router = APIRouter()


def verify_admin(x_admin_secret: str = Header(...)):
    """Simple header-based admin auth — completely separate from user JWT."""
    if x_admin_secret != settings.ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")


@router.get("/users")
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_admin),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Returns all registered users with profile details and login stats."""

    # Get all users with profiles
    stmt = (
        select(User)
        .options(selectinload(User.profile))
        .order_by(desc(User.created_at))
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    # Get login counts per user
    counts_stmt = (
        select(LoginEvent.user_id, func.count(LoginEvent.id).label("total_logins"))
        .group_by(LoginEvent.user_id)
    )
    counts_result = await db.execute(counts_stmt)
    login_counts = {row.user_id: row.total_logins for row in counts_result}

    # Get last login per user
    last_login_stmt = (
        select(
            LoginEvent.user_id,
            func.max(LoginEvent.timestamp).label("last_login"),
        )
        .group_by(LoginEvent.user_id)
    )
    last_result = await db.execute(last_login_stmt)
    last_logins = {row.user_id: row.last_login for row in last_result}

    # Get signup method per user (first event)
    method_stmt = select(LoginEvent).where(LoginEvent.event_type == "signup")
    method_result = await db.execute(method_stmt)
    signup_methods = {row.user_id: row.method for row in method_result.scalars()}

    # Total count
    total_stmt = select(func.count(User.id))
    total_result = await db.execute(total_stmt)
    total_count = total_result.scalar()

    rows = []
    for u in users:
        p = u.profile
        rows.append({
            "id": str(u.id),
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "signup_method": signup_methods.get(u.id, "password"),
            "total_logins": login_counts.get(u.id, 0),
            "last_login": last_logins[u.id].isoformat() if u.id in last_logins else None,
            # Profile fields
            "display_name": p.display_name if p else None,
            "korean_name": p.korean_name if p else None,
            "native_language": p.native_language if p else None,
            "korean_proficiency": p.korean_proficiency if p else None,
            "study_reason": p.study_reason if p else None,
            "occupation": p.occupation if p else None,
            "gender": p.gender if p else None,
            "dob": p.dob if p else None,
            "total_xp": p.total_xp if p else 0,
            "current_streak": p.current_streak if p else 0,
            "level_progress": p.level_progress if p else 1,
            "last_active": p.last_active.isoformat() if p and p.last_active else None,
        })

    return {"total": total_count, "users": rows}


@router.get("/login-events")
async def get_login_events(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_admin),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    event_type: Optional[str] = Query(None),
    method: Optional[str] = Query(None),
):
    """Returns paginated login/signup event log."""

    stmt = select(LoginEvent).order_by(desc(LoginEvent.timestamp))
    if event_type:
        stmt = stmt.where(LoginEvent.event_type == event_type)
    if method:
        stmt = stmt.where(LoginEvent.method == method)
    stmt = stmt.limit(limit).offset(offset)

    result = await db.execute(stmt)
    events = result.scalars().all()

    # Total count for pagination
    count_stmt = select(func.count(LoginEvent.id))
    if event_type:
        count_stmt = count_stmt.where(LoginEvent.event_type == event_type)
    if method:
        count_stmt = count_stmt.where(LoginEvent.method == method)
    total_result = await db.execute(count_stmt)
    total_count = total_result.scalar()

    rows = [
        {
            "id": str(e.id),
            "user_id": str(e.user_id),
            "email": e.email,
            "event_type": e.event_type,
            "method": e.method,
            "ip_address": e.ip_address,
            "user_agent": e.user_agent,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in events
    ]

    return {"total": total_count, "events": rows}


@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_admin),
):
    """Quick summary stats for the admin dashboard header."""

    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_events = (await db.execute(select(func.count(LoginEvent.id)))).scalar()

    google_signups = (
        await db.execute(
            select(func.count(LoginEvent.id)).where(
                LoginEvent.event_type == "signup", LoginEvent.method == "google"
            )
        )
    ).scalar()

    password_signups = (
        await db.execute(
            select(func.count(LoginEvent.id)).where(
                LoginEvent.event_type == "signup", LoginEvent.method == "password"
            )
        )
    ).scalar()

    return {
        "total_users": total_users,
        "total_login_events": total_events,
        "google_signups": google_signups,
        "password_signups": password_signups,
    }


@router.get("/export/users.csv")
async def export_users_csv(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_admin),
):
    """Export all users as a CSV file."""
    # Reuse the users logic
    data = await get_all_users(db=db, _=None, limit=500, offset=0)
    users = data["users"]

    output = io.StringIO()
    if not users:
        output.write("No users found.\n")
    else:
        fieldnames = list(users[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(users)

    output.seek(0)
    return StreamingResponse(
        iter([output.read()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aera_ai_users.csv"},
    )
