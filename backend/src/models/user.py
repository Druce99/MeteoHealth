import uuid
from sqlalchemy import VARCHAR, ARRAY, Float, SmallInteger
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel
from .enums import AgeGroup, HealthCondition


class User(BaseModel):
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    age_group: Mapped[AgeGroup] = mapped_column(SAEnum(AgeGroup), nullable=False)
    location_name: Mapped[str] = mapped_column(VARCHAR(100), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    conditions: Mapped[list[HealthCondition]] = mapped_column(ARRAY(SAEnum(HealthCondition)), default=list, nullable=False)
    sensitivity_pressure: Mapped[int] = mapped_column(SmallInteger, default=2)
    sensitivity_kp: Mapped[int] = mapped_column(SmallInteger, default=2)
    sensitivity_temp: Mapped[int] = mapped_column(SmallInteger, default=2)
    expo_token: Mapped[str | None] = mapped_column(VARCHAR(200), nullable=True)
    diary_entries: Mapped[list["DiaryEntry"]] = relationship(
        "DiaryEntry",
        back_populates="user"
    )
    
    notification_settings: Mapped["UserNotificationSettings"] = relationship(
        "UserNotificationSettings",
        back_populates="user",
        uselist=False
    )
    
    ml_models: Mapped[list["MLModel"]] = relationship(
        "MLModel",
        back_populates="user"
    )

