from fastapi import APIRouter, Depends
from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_async_db
from src.repositories.user_repository import UserRepository
from src.services.forecast_service import ForecastService
from src.schemas.forecast import TodayForecastResponse, WeekForecastResponse

router = APIRouter()

def get_forecast_service(db: AsyncSession = Depends(get_async_db)) -> ForecastService:
    user_repo = UserRepository(db)
    return ForecastService(user_repo, db)

@router.get("/{user_id}/today", response_model=TodayForecastResponse)
async def get_today(user_id: UUID, service: ForecastService = Depends(get_forecast_service)):
    return await service.get_today(user_id)

@router.get("/{user_id}/week", response_model=WeekForecastResponse)
async def get_week(user_id: UUID, service: ForecastService = Depends(get_forecast_service)):
    return await service.get_week(user_id)

@router.get("/{user_id}/{target_date}", response_model=TodayForecastResponse)
async def get_by_date(user_id: UUID, target_date: date, service: ForecastService = Depends(get_forecast_service)):
    return await service.get_by_date(user_id, target_date)
