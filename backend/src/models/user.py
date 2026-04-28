from sqlalchemy import VARCHAR, FLOAT, ARRAY, String
from sqlalchemy.dialects.postgresql import JSONB
from  sqlalchemy.orm import Mapped, mapped_column, relationship
from .enums import AgeGroup, HealthCondition
from .base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    age_group: Mapped[AgeGroup] = mapped_column(VARCHAR(20), nullable=False)
    city: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    latitude: Mapped[float] = mapped_column(FLOAT, nullable=False)
    longitude: Mapped[float] = mapped_column(FLOAT, nullable=False)
    conditions: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    sensitivity: Mapped[dict] = mapped_column(JSONB, default=dict)
    expo_token: Mapped[str | None] = mapped_column(VARCHAR(200), nullable=True)