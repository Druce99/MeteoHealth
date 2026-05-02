from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import date

from .base import BaseRepository
from src.models.diary_entry import DiaryEntry

class DiaryRepository(BaseRepository[DiaryEntry]):
    def __init__(self, db: AsyncSession):
        super().__init__(DiaryEntry, db)
    
    async def get_by_user_id(self, user_id: UUID) -> list[DiaryEntry]:
        result = await self.db.scalars(select(DiaryEntry).where(DiaryEntry.user_id == user_id).order_by(DiaryEntry.entry_date.desc()))
        return list(result.all())
    
    async def get_by_user_and_date(self, user_id: UUID, entry_date: date) -> DiaryEntry | None:
        result = await self.db.scalars(select(DiaryEntry).where(DiaryEntry.user_id == user_id, DiaryEntry.entry_date == entry_date))
        return result.first()