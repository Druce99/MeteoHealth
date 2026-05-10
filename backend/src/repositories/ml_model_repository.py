from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from .base import BaseRepository
from src.models.ml_model  import MLModel

class MlModelRepository(BaseRepository[MLModel]):
    def __init__(self, db: AsyncSession):
        super().__init__(MLModel, db)
    
    async def get_active_by_user_id(self, user_id: UUID) -> MLModel | None:
        result = await self.db.scalars(select(MLModel).where(MLModel.user_id == user_id, MLModel.is_active == True))
        return result.first()