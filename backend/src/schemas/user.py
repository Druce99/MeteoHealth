from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from src.models.enums import AgeGroup, HealthCondition

class UserCreate(BaseModel):
    name: str = Field(max_length=100, min_length=0, description="Имя пользователя")
    age_group: AgeGroup = Field(description="Возрастная группа")
    location_name: str | None = Field(None, max_length=100, min_length=0, description="Имя местоположения")
    latitude: float = Field(ge=-90, le=90, description="Широта")
    longitude: float = Field(ge=-180, le=180, description="Долгота")
    conditions: list[HealthCondition] = Field(default_factory=list, description="Список болезней")
    sensitivity_pressure: int = Field(ge=1, le=3, default=2, description="Чувствительность к давлению (1-низкая, 2-средняя, 3-высокая)")
    sensitivity_kp: int = Field(ge=1, le=3, default=2, description="Чувствительность к магнитным бурям (1-низкая, 2-средняя, 3-высокая)")
    sensitivity_temp: int = Field(ge=1, le=3, default=2, description="Чувствительность к температуре (1-низкая, 2-средняя, 3-высокая)")
    expo_token: str | None = Field(None, max_length=200, description="Токен для push-уведомлений")

class UserUpdate(BaseModel):
    name: str | None = Field(None, max_length=100, min_length=0, description="Имя пользователя")
    age_group: AgeGroup | None = Field(None, description="Возрастная группа")
    location_name: str | None = Field(None, max_length=100, min_length=0, description="Имя местоположения")
    latitude: float | None = Field(None, ge=-90, le=90, description="Широта")
    longitude: float | None = Field(None, ge=-180, le=180, description="Долгота")
    conditions: list[HealthCondition] | None = Field(None, description="Список болезней")
    sensitivity_pressure: int | None = Field(None, ge=1, le=3, description="Чувствительность к давлению (1-низкая, 2-средняя, 3-высокая)")
    sensitivity_kp: int | None = Field(None, ge=1, le=3, description="Чувствительность к магнитным бурям (1-низкая, 2-средняя, 3-высокая)")
    sensitivity_temp: int | None = Field(None, ge=1, le=3, description="Чувствительность к температуре (1-низкая, 2-средняя, 3-высокая)")
    expo_token: str | None = Field(None, max_length=200, description="Токен для push-уведомлений")

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(description="ID пользователя")
    name: str = Field(max_length=100, min_length=0, description="Имя пользователя")
    age_group: AgeGroup = Field(description="Возрастная группа")
    location_name: str | None = Field(None, max_length=100, min_length=0, description="Имя местоположения")
    latitude: float = Field(ge=-90, le=90, description="Широта")
    longitude: float = Field(ge=-180, le=180, description="Долгота")
    conditions: list[HealthCondition] = Field(default_factory=list, description="Список болезней")
    sensitivity_pressure: int = Field(ge=1, le=3, default=2, description="Чувствительность к давлению (1-низкая, 2-средняя, 3-высокая)")
    sensitivity_kp: int = Field(ge=1, le=3, default=2, description="Чувствительность к магнитным бурям (1-низкая, 2-средняя, 3-высокая)")
    sensitivity_temp: int = Field(ge=1, le=3, default=2, description="Чувствительность к температуре (1-низкая, 2-средняя, 3-высокая)")
    expo_token: str | None = Field(None, max_length=200, description="Токен для push-уведомлений")
    created_at: datetime = Field(description="Время создания")