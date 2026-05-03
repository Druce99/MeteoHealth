from fastapi import APIRouter, Depends, status
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_async_db
from src.repositories.user_repository import UserRepository
from src.services.user_service import UserService
from src.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter()

def get_user_service(db: AsyncSession = Depends(get_async_db)) -> UserService:
    user_repo = UserRepository(db)
    return UserService(user_repo, db)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(data: UserCreate, service: UserService = Depends(get_user_service)):
    return await service.create_user(data)

@router.get("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user(user_id: UUID, service: UserService  = Depends(get_user_service)):
    return await service.get_user(user_id)

@router.put("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user(user_id: UUID, data: UserUpdate, service: UserService = Depends(get_user_service)):
    return await service.update_user(user_id, data)

@router.put("/{user_id}/token", response_model=UserResponse)
async def update_expo_token(user_id: UUID, token: str, service: UserService = Depends(get_user_service)):
    return await service.update_expo_token(user_id, token)