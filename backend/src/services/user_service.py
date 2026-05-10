from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.user_repository import UserRepository
from src.models.user import User
from src.schemas.user import UserCreate, UserUpdate
from src.core.exceptions import NotFoundException

class UserService:
    def __init__(self, user_repo: UserRepository, db: AsyncSession):
        self.user_repo = user_repo
        self.db = db
    
    async def get_user(self, user_id: UUID) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")
        return user
    
    async def create_user(self, data: UserCreate) -> User:
        user = await self.user_repo.create(data.model_dump())
        await self.db.commit()
        return user
    
    async def update_user(self, user_id: UUID, data: UserUpdate) -> User:
        user = await self.user_repo.update(user_id, data.model_dump(exclude_none=True))
        if not user:
            raise NotFoundException("Пользователь не найден")
        await self.db.commit()
        return user
    
    async def update_expo_token(self, user_id: UUID, token: str) -> User:
        user = await self.user_repo.update(user_id, {"expo_token": token})
        if not user:
            raise NotFoundException("Пользователь не найден")
        await self.db.commit()
        return user