from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.session import Session as DbSession
from app.models.user import User


SESSION_COOKIE_NAME = "gitloop_session"


def get_current_user(
    gitloop_session: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not gitloop_session:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    session = (
        db.query(DbSession)
        .filter(
            DbSession.session_token == gitloop_session
        )
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid session",
        )

    user = (
        db.query(User)
        .filter(User.id == session.user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user