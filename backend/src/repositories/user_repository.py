
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from .base import BaseRepository
from src.models.user import User as UserModel

class UserRepository(BaseRepository[UserModel]):
    def __init__(self, db: AsyncSession):
        super().__init__(UserModel, db)
    
    async def get_by_expo_token(self, expo_token: str) -> UserModel | None:
        result = await self.db.scalars(select(UserModel).where(UserModel.expo_token == expo_token))
        return result.first()