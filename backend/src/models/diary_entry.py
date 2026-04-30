from sqlalchemy import Date, Integer, ARRAY, Float, Text, UniqueConstraint, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
import uuid

from .base import BaseModel
from .enums import Symptom

class DiaryEntry(BaseModel):
    __tablename__ = "diary_entries"
    __table_args__ = (UniqueConstraint("user_id", "entry_date"),)
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    wellbeing_score: Mapped[int] = mapped_column(Integer, nullable=False)
    symptoms: Mapped[list[Symptom]] = mapped_column(ARRAY(SAEnum(Symptom)), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    pressure: Mapped[float | None] = mapped_column(Float, nullable=True)
    kp_index: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    user: Mapped["User"] = relationship(
        "User",
        back_populates="diary_entries"
    )
