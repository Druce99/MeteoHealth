from sqlalchemy import ForeignKey, Boolean, SmallInteger, Time, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import time, datetime

from .base import BaseModel

class UserNotificationSettings(BaseModel):
    __tablename__ = "notification_settings"
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    notify_pressure: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_kp: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_temp: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_humidity: Mapped[bool] = mapped_column(Boolean, default=False)
    kp_threshold: Mapped[int] = mapped_column(SmallInteger, default=5)
    temp_threshold: Mapped[int] = mapped_column(SmallInteger, default=7)
    quiet_from: Mapped[time] = mapped_column(Time, default=time(23,0))
    quiet_to: Mapped[time] = mapped_column(Time, default=time(7,0))
    digest_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    digest_time: Mapped[time] = mapped_column(Time, default=time(8,0))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    user: Mapped["User"] = relationship(
        "User",
        back_populates="notification_settings"
    )

