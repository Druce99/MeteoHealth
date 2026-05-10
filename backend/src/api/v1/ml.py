from fastapi import APIRouter, Depends, status
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_async_db
from src.repositories.ml_model_repository import MlModelRepository
from src.services.ml_service import MlService
from src.repositories.diary_repository import DiaryRepository
from src.repositories.user_repository import UserRepository

router = APIRouter()

def get_ml_service(db: AsyncSession = Depends(get_async_db)) -> MlService:
    diary_repo =  DiaryRepository(db)
    ml_repo = MlModelRepository(db)
    user_repo = UserRepository(db)
    return MlService(diary_repo, ml_repo, user_repo, db)

@router.get("/{user_id}/predictions", response_model=list, status_code=status.HTTP_200_OK)
async def get_predictions(user_id: UUID, service: MlService = Depends(get_ml_service)):
    return await service.get_predictions(user_id)

@router.post("/{user_id}/train", response_model=dict, status_code=status.HTTP_201_CREATED)
async def train_model(user_id: UUID, service: MlService = Depends(get_ml_service)):
    return await service.train_model(user_id)