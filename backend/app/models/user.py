from sqlalchemy import Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default='viewer')
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    requested_changes = relationship('ChangeRequest', back_populates='requester', foreign_keys='ChangeRequest.requester_id')
    reviewed_changes = relationship('ChangeRequest', back_populates='reviewer', foreign_keys='ChangeRequest.reviewer_id')
    created_configs = relationship('ConfigItem', back_populates='creator', foreign_keys='ConfigItem.created_by')
    created_baselines = relationship('Baseline', back_populates='creator', foreign_keys='Baseline.created_by')
