from src.core.redis import broker
from src.core.database import async_session_maker
from src.repositories.user_repository import UserRepository
from src.repositories.diary_repository import DiaryRepository
from src.repositories.ml_model_repository import MlModelRepository
from src.services.ml_service import MlService
from uuid import UUID

@broker.subscriber("ml:train")
async def train_model(user_id: str):
    async with async_session_maker() as db:
        service = MlService(DiaryRepository(db), MlModelRepository(db), UserRepository(db), db)
        try:
            await service.train_model(UUID(user_id))
        except Exception:
            pass
