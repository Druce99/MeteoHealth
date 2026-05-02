from typing import Generic, TypeVar
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from src.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    
    def __init__(self, model: type[ModelType], db: AsyncSession) -> None:
        self.model = model
        self.db = db
    
    async def get_by_id(self, id: UUID) -> ModelType | None:
        result = await self.db.scalars(select(self.model).where(self.model.id == id))
        return result.first()
    
    async def get_all(self) -> list[ModelType]:
        result = await self.db.scalars(select(self.model))
        return list(result.all())
    
    async def create(self, data: dict) -> ModelType:
        instance = self.model(**data)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance
    
    async def update(self, id: UUID, data: dict) -> ModelType | None:
        instance = await self.get_by_id(id)
        if not instance:
            return None
        
        await self.db.execute(
            update(self.model)
            .where(self.model.id == id)
            .values(**data)
        )
        await self.db.flush()
        await self.db.refresh(instance)
        return instance
    
    async def delete(self, id: UUID) -> bool:
        instance = await self.get_by_id(id)
        if not instance:
            return False
        await self.db.delete(instance)
        await self.db.flush()
        return True