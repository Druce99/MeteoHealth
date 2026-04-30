from sqlalchemy import SmallInteger, VARCHAR, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel
from .enums import HealthCondition, WeatherTrigger

class Recommendation(BaseModel):
    __tablename__ = "recommendations"
    
    rec_text: Mapped[str] = mapped_column(Text, nullable=False)
    condition: Mapped[HealthCondition] = mapped_column(SAEnum(HealthCondition), nullable=False)
    trigger: Mapped[WeatherTrigger] = mapped_column(SAEnum(WeatherTrigger), nullable=False)
    priority: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    icon: Mapped[str] = mapped_column(VARCHAR(50), nullable=False)
