import httpx
from src.core.redis import broker, redis_client
from src.core.database import async_session_maker
from src.repositories.user_repository import UserRepository
from src.services.forecast_service import ForecastService
import json

@broker.subscriber("notification:check")
async def check_notifications(_: str = ""):
    async with async_session_maker() as db:
        user_repo = UserRepository(db)
        users = await user_repo.get_all()

        for user in users:
            if not user.expo_token:
                continue
            forecast_service = ForecastService(user_repo, db)
            today = await forecast_service.get_today(user.id)
            if today["wellness_index"] < 40:
                await _send_push(user.expo_token, "Внимание!", "Сегодня неблагоприятный день для вашего самочувствия")

async def _send_push(token: str, title: str, body: str):
    async with httpx.AsyncClient() as client:
        await client.post("https://exp.host/--/api/v2/push/send", json={
            "to": token, "title": title, "body": body
        })