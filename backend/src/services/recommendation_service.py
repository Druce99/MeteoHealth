from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.recommendation_repository import RecommendationRepository
from src.repositories.user_repository import UserRepository
from src.models.recommendation import Recommendation
from src.models.enums import WeatherTrigger
from src.core.exceptions import NotFoundException

class RecommendationService:
    def __init__(self, recommendation_repo: RecommendationRepository, user_repo: UserRepository, db: AsyncSession):
        self.recommendation_repo = recommendation_repo
        self.user_repo = user_repo
        self.db = db
    
    async def get_recommendations_for_user(self, user_id: UUID, triggers: list[WeatherTrigger]) -> list[Recommendation]:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")
        result = []
        for condition in user.conditions:
            for trigger in triggers:
                recs = await self.recommendation_repo.get_by_condition_and_trigger(condition, trigger)
                result.extend(recs)
        return result
    
    async def get_all_recommendations(self) -> list[Recommendation]:
        return await self.recommendation_repo.get_all()