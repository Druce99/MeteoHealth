from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .base import BaseRepository
from src.models.recommendation import Recommendation
from src.models.enums import HealthCondition, WeatherTrigger

class RecommendationRepository(BaseRepository[Recommendation]):
    def __init__(self, db: AsyncSession):
        super().__init__(Recommendation, db)
    
    async def get_by_condition_and_trigger(self, condition: HealthCondition, trigger: WeatherTrigger) -> list[Recommendation]:
        result = await self.db.scalars(select(Recommendation).where(Recommendation.condition == condition, Recommendation.trigger == trigger).order_by(Recommendation.priority))
        return list(result.all())