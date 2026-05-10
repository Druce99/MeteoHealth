from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from datetime import date as DateType

from src.models.enums import Symptom

class DiaryCreate(BaseModel):
    date: DateType = Field(description="Дата записи")
    wellbeing_score: int = Field(ge=1, le=10, description="Оценка самочувствия (1-плохо, 10-отлично)")
    symptoms: list[Symptom] = Field(default_factory=list, description="Список симптомов")
    note: str | None = Field(None, description="Заметка пользователя")

class DiaryUpdate(BaseModel):
    date: DateType | None = Field(None, description="Дата записи")
    wellbeing_score: int | None = Field(None, ge=1, le=10, description="Оценка самочувствия (1-плохо, 10-отлично)")
    symptoms: list[Symptom] | None = Field(None, description="Список симптомов")
    note: str | None = Field(None, description="Заметка пользователя")

class DiaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(description="ID записи")
    user_id: UUID = Field(description="ID пользователя")
    date: DateType = Field(description="Дата записи")
    wellbeing_score: int = Field(ge=1, le=10, description="Оценка самочувствия (1-плохо, 10-отлично)")
    symptoms: list[Symptom] = Field(default_factory=list, description="Список симптомов")
    note: str | None = Field(None, description="Заметка пользователя")
    pressure: float | None = Field(None, description="Атмосферное давление (мм рт. ст.)")
    kp_index: float | None = Field(None, description="Kp-индекс геомагнитной активности")
    temperature: float | None = Field(None, description="Температура (°C)")
    humidity: float | None = Field(None, description="Влажность (%)")
    created_at: datetime = Field(description="Время создания")
