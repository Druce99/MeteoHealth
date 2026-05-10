from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.notification_settings_repository import NotificationSettingsRepository
from src.repositories.user_repository import UserRepository
from src.models.user_notification_settings import UserNotificationSettings
from src.schemas.notification_settings import NotificationSettingsUpdate
from src.core.exceptions import NotFoundException

class NotificationSettingsService:
    def __init__(self, settings_repo: NotificationSettingsRepository, user_repo: UserRepository, db: AsyncSession):
        self.settings_repo = settings_repo
        self.user_repo =user_repo
        self.db = db
    
    async def get_settings(self, user_id: UUID) -> UserNotificationSettings:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")
        settings = await self.settings_repo.get_by_user_id(user_id)
        if not settings:
            settings = await self.settings_repo.create({"user_id": user_id})
            await self.db.commit()
            await self.db.refresh(settings)
        return settings
    
    async def update_settings(self, user_id: UUID, data: NotificationSettingsUpdate) -> UserNotificationSettings:
        settings = await self.settings_repo.get_by_user_id(user_id)
        if not settings:
            raise NotFoundException("Настройки не найдены")
        updated = await self.settings_repo.update(settings.id, data.model_dump(exclude_none=True))
        await self.db.commit()
        return updated