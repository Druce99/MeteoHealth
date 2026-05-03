from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.diary_repository  import DiaryRepository
from src.repositories.user_repository import UserRepository
from src.models.diary_entry import DiaryEntry
from src.schemas.diary import DiaryCreate, DiaryUpdate
from src.core.exceptions import NotFoundException

class DiaryService:
    def __init__(self, diary_repo: DiaryRepository, user_repo: UserRepository, db: AsyncSession):
        self.diary_repo = diary_repo
        self.user_repo = user_repo
        self.db = db
    
    async def get_entries(self, user_id: UUID) -> list[DiaryEntry]:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")
        return await self.diary_repo.get_by_user_id(user_id)
    
    async def get_entry_by_date(self, user_id: UUID, entry_date: date) -> DiaryEntry:
        entry = await self.diary_repo.get_by_user_and_date(user_id, entry_date)
        if not entry:
            raise NotFoundException("Запись не найдена")
        return entry
    
    async def create_entry(self, user_id: UUID, data: DiaryCreate) -> DiaryEntry:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")
        entry = await self.diary_repo.create({**data.model_dump(), "user_id": user_id})
        await self.db.commit()
        return entry

    async def update_entry(self, user_id: UUID, entry_date: date, data: DiaryUpdate) -> DiaryEntry:
        entry = await self.diary_repo.get_by_user_and_date(user_id, entry_date)
        if not entry:
            raise NotFoundException("Запись не найдена")
        updated = await self.diary_repo.update(entry.id, data.model_dump(exclude_none=True))
        await self.db.commit()
        return updated
