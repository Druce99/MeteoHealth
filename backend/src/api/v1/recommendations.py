from fastapi import APIRouter, Depends
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_async_db
from src.repositories.recommendation_repository import RecommendationRepository
from src.repositories.user_repository import UserRepository
from src.services.recommendation_service import RecommendationService
from src.schemas.recommendation import RecommendationResponse

router = APIRouter()

def get_recommendation_service(db: AsyncSession = Depends(get_async_db)) -> RecommendationService:
    recommendation_repo = RecommendationRepository(db)
    user_repo = UserRepository(db)
    return RecommendationService(recommendation_repo, user_repo, db)

@router.get("/general", response_model=list[RecommendationResponse])
async def get_all_recommendations(service: RecommendationService = Depends(get_recommendation_service)):
    return await service.get_all_recommendations()

@router.get("/{user_id}/today", response_model=list[RecommendationResponse])
async def get_today_recommendations(user_id: UUID, service: RecommendationService = Depends(get_recommendation_service)):
    return await service.get_today_recommendations(user_id)