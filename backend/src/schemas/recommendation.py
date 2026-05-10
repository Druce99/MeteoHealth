from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime

from src.models.enums import HealthCondition, WeatherTrigger

class RecommendationCreate(BaseModel):
    text: str = Field(min_length=1, description="Текст рекомендации")
    condition: HealthCondition = Field(description="Условие здоровья")
    trigger: WeatherTrigger = Field(description="Погодный триггер")
    priority: int = Field(ge=1, le=3, description="Приоритет (1-высокий, 2-средний, 3-низкий)")
    icon: str = Field(max_length=50, description="Название иконки Ionicons")

class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(description="ID рекомендации")
    text: str = Field(min_length=1, description="Текст рекомендации")
    condition: HealthCondition = Field(description="Условие здоровья")
    trigger: WeatherTrigger = Field(description="Погодный триггер")
    priority: int = Field(ge=1, le=3, description="Приоритет (1-высокий, 2-средний, 3-низкий)")
    icon: str = Field(max_length=50, description="Название иконки Ionicons")
    created_at: datetime = Field(description="Время создания")
