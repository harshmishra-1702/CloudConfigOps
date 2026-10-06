from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class ChangeRequest(Base):
    __tablename__ = 'change_requests'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    config_item_id: Mapped[int] = mapped_column(Integer, ForeignKey('config_items.id'), nullable=False)
    requester_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False)
    reviewer_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default='pending')
    priority: Mapped[str] = mapped_column(String(50), default='medium')
    diff_content: Mapped[str] = mapped_column(Text, nullable=True)
    review_comment: Mapped[str] = mapped_column(Text, nullable=True)
    
    deployed_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    config_item = relationship('ConfigItem', back_populates='change_requests')
    requester = relationship('User', foreign_keys=[requester_id], back_populates='requested_changes')
    reviewer = relationship('User', foreign_keys=[reviewer_id], back_populates='reviewed_changes')
