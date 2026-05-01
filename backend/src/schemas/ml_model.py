from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime

class MLModelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(description="ID модели")
    user_id: UUID = Field(description="ID пользователя")
    model_path: str = Field(description="Путь к файлу модели")
    accuracy: float | None = Field(description="R² score модели")
    entries_count: int = Field(description="Количество записей при обучении")
    is_active: bool = Field(description="Активная ли модель")
    trained_at: datetime = Field(description="Время обучения")
    created_at: datetime = Field(description="Время создания")