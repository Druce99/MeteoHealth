from pydantic import BaseModel, Field
from datetime import date

class DayForecast(BaseModel):
    date: date 
    pressure: float = Field(gt=0, description="Атмосферное давление")
    temperature: float = Field(ge=-90, le=60, description="Темпиратура воздуха")
    humidity: float = Field(ge=0, le=100, description="Относительная влажность")
    kp_index: float | None = Field(None, description="Kp-индекс геомагнитной активности")
    wellness_index: int = Field(ge=0, le=100, description="Индекс благополучия")

class TodayForecastResponse(DayForecast):
    color: str = Field(description="Цвет индикатора: green | yellow | red")

class WeekForecastResponse(BaseModel):
    days: list[DayForecast]