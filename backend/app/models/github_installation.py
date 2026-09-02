from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class GitHubInstallation(Base):
    __tablename__ = "github_installations"

    id: Mapped[int] = mapped_column(
        Integer, 
        primary_key=True, 
        index=True,
        )
    
    installation_id: Mapped[int] = mapped_column(
        Integer, 
        unique=True, 
        nullable=False,
        index=True
        )
    
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
          default=datetime.utcnow,
          nullable=False,
          )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
         default=datetime.utcnow,
         onupdate=datetime.utcnow,
         nullable=False,
         
         )