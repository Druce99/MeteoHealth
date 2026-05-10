from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.diary_repository import DiaryRepository
from src.repositories.ml_model_repository import MlModelRepository
from src.repositories.user_repository import UserRepository
from src.services.forecast_service import ForecastService
from src.ml import trainer, predictor
from src.core.exceptions import NotFoundException

MIN_ENTRIES = 14

class MlService:
    def __init__(self, diary_repo: DiaryRepository, ml_repo: MlModelRepository, user_repo: UserRepository, db: AsyncSession):
        self.diary_repo = diary_repo
        self.ml_repo = ml_repo
        self.user_repo = user_repo
        self.db = db
    
    async def train_model(self, user_id: UUID) -> dict:
        entries = await self.diary_repo.get_by_user_id(user_id)
        if len(entries) < MIN_ENTRIES:
            raise NotFoundException(f"Недостаточно записей для обучения (минимум {MIN_ENTRIES})")
        
        entries_data = [
            {
                "pressure": e.pressure,
                "kp_index": e.kp_index,
                "temperature": e.temperature,
                "humidity": e.humidity,
                "date": e.date,
                "wellbeing_score": e.wellbeing_score,
            }
            for e in entries
        ]
        model_path, score = trainer.train(user_id, entries_data)
        
        ml_model = await self.ml_repo.create({
            "user_id": user_id,
            "model_path": model_path,
            "accuracy": score,
            "entries_count": len(entries),
            "is_active": True,
        })
        await self.db.commit()
        return {"model_path": model_path, "accuracy": score}
    
    async def get_predictions(self, user_id: UUID) -> list[dict]:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")
        
        ml_model = await self.ml_repo.get_active_by_user_id(user_id)
        if not ml_model:
            raise NotFoundException("Модель не найдена — нужно минимум 14 записей в дневнике")
        
        forecast_service = ForecastService(self.user_repo, self.db)
        week = await forecast_service.get_week(user_id)
        
        return predictor.predict(ml_model.model_path, week["days"])