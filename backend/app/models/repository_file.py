from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class RepositoryFile(Base):
    __tablename__ = "repository_files"

    __table_args__ = (
        UniqueConstraint(
            "repository_index_id",
            "path",
            name="uq_repository_file_path",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    repository_index_id: Mapped[int] = mapped_column(
        ForeignKey(
            "repository_indexes.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    path: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    extension: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="",
    )

    language: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    category: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="other",
    )

    size: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    sha: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )