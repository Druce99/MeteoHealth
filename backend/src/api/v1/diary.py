from fastapi import APIRouter, Depends, status
from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_async_db
from src.repositories.diary_repository import DiaryRepository
from src.repositories.user_repository import UserRepository
from src.services.diary_service import DiaryService
from src.schemas.diary import DiaryCreate, DiaryUpdate, DiaryResponse

router = APIRouter()

def get_diary_service(db: AsyncSession = Depends(get_async_db)) -> DiaryService:
    diary_repo  = DiaryRepository(db)
    user_repo = UserRepository(db)
    return DiaryService(diary_repo, user_repo, db)

@router.post("/{user_id}", response_model=DiaryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(user_id: UUID, data: DiaryCreate, service: DiaryService = Depends(get_diary_service)):
    return await service.create_entry(user_id, data)

@router.get("/{user_id}", response_model=list[DiaryResponse])
async def get_entries(user_id: UUID, service: DiaryService = Depends(get_diary_service)):
    return await service.get_entries(user_id)

@router.get("/{user_id}/{entry_date}", response_model=DiaryResponse)
async def get_entry_by_date(user_id: UUID, entry_date: date, service: DiaryService = Depends(get_diary_service)):
    return await service.get_entry_by_date(user_id, entry_date)

@router.put("/{user_id}/{entry_date}", response_model=DiaryResponse)
async def update_entry(user_id: UUID, entry_date: date, data: DiaryUpdate, service: DiaryService = Depends(get_diary_service)):
    return await service.update_entry(user_id, entry_date, data)