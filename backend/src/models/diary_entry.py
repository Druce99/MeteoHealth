from sqlalchemy import Date, Integer, ARRAY, String, Float, Text, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
import uuid

from .base import BaseModel

class DiaryEntry(BaseModel):
    __tablename__ = "diary_entries"
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    wellbeing_score: Mapped[int] = mapped_column(Integer, nullable=False)
    symptoms: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    pressure: Mapped[float | None] = mapped_column(Float, nullable=True)
    kp_index: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    __table_args__ = (UniqueConstraint("user_id", "entry_date"),)
