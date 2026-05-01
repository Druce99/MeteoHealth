from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime, time

class NotificationSettingsUpdate(BaseModel):
    notify_pressure: bool | None = Field(None, description="Уведомлять об изменении давления")
    notify_kp: bool | None = Field(None, description="Уведомлять о магнитных бурях")
    notify_temp: bool | None = Field(None, description="Уведомлять об изменении температуры")
    notify_humidity: bool | None = Field(None, description="Уведомлять об изменении влажности")
    kp_threshold: int | None = Field(None, ge=3, le=9, description="Минимальный Kp-индекс для уведомления")
    temp_threshold: int | None = Field(None, ge=1, le=20, description="Минимальный перепад температуры для уведомления (°C)")
    quiet_from: time | None = Field(None, description="Начало тихого времени")
    quiet_to: time | None = Field(None, description="Конец тихого времени")
    digest_enabled: bool | None = Field(None, description="Включить утренний дайджест")
    digest_time: time | None = Field(None, description="Время отправки дайджеста")

class NotificationSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(description="ID уведомления")
    user_id: UUID = Field(description="ID пользователя")
    notify_pressure: bool = Field(default=True, description="Уведомлять об изменении давления")
    notify_kp: bool = Field(default=True, description="Уведомлять о магнитных бурях")
    notify_temp: bool = Field(default=True, description="Уведомлять об изменении температуры")
    notify_humidity: bool = Field(default=False, description="Уведомлять об изменении влажности")
    kp_threshold: int = Field(default=5, ge=3, le=9, description="Минимальный Kp-индекс для уведомления")
    temp_threshold: int = Field(default=7, ge=1, le=20, description="Минимальный перепад температуры для уведомления (°C)")
    quiet_from: time = Field(default=time(23,0), description="Начало тихого времени")
    quiet_to: time = Field(default=time(7,0), description="Конец тихого времени")
    digest_enabled: bool = Field(default=True, description="Включить утренний дайджест")
    digest_time: time = Field(default=time(8,0), description="Время отправки дайджеста")
    updated_at: datetime = Field(description="Время обновления")
    created_at: datetime = Field(description="Время создания")