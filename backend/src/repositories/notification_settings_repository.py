from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from .base import BaseRepository
from src.models.user_notification_settings import UserNotificationSettings

class NotificationSettingsRepository(BaseRepository[UserNotificationSettings]):
    def __init__(self, db: AsyncSession):
        super().__init__(UserNotificationSettings, db)
    
    async def get_by_user_id(self, user_id: UUID) -> UserNotificationSettings | None:
        result = await self.db.scalars(select(UserNotificationSettings).where(UserNotificationSettings.user_id == user_id))
        return result.first()