from fastapi import APIRouter, Depends
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_async_db
from src.repositories.notification_settings_repository import NotificationSettingsRepository
from src.repositories.user_repository import UserRepository
from src.services.notification_settings_service import NotificationSettingsService
from src.schemas.notification_settings import NotificationSettingsUpdate, NotificationSettingsResponse

router = APIRouter()

def get_settings_service(db: AsyncSession = Depends(get_async_db)) -> NotificationSettingsService:
    settings_repo = NotificationSettingsRepository(db)
    user_repo = UserRepository(db)
    return NotificationSettingsService(settings_repo, user_repo, db)

@router.get("/{user_id}", response_model=NotificationSettingsResponse)
async def get_settings(user_id: UUID, service: NotificationSettingsService = Depends(get_settings_service)):
    return await service.get_settings(user_id)

@router.put("/{user_id}", response_model=NotificationSettingsResponse)
async def update_settings(user_id: UUID, data: NotificationSettingsUpdate, service: NotificationSettingsService = Depends(get_settings_service)):
    return await service.update_settings(user_id, data)
