from sqlalchemy import ForeignKey, Boolean, DateTime, func, VARCHAR, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime

from .base import BaseModel

class MLModel(BaseModel):
    __tablename__ = "ml_models"
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    model_path: Mapped[str] = mapped_column(VARCHAR(500), nullable=False)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    entries_count: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    trained_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    user: Mapped["User"] = relationship(
        "User",
        back_populates="ml_models"
    )
