from src.core.redis import broker
from src.core.database import async_session_maker
from src.repositories.user_repository import UserRepository
from src.services.forecast_service import ForecastService
import httpx

@broker.subscriber("digest:send")
async def send_digest(_: str = ""):
    async with async_session_maker() as db:
        user_repo = UserRepository(db)
        users = await user_repo.get_all()

        for user in users:
            if not user.expo_token:
                continue
            forecast_service = ForecastService(user_repo, db)
            today = await forecast_service.get_today(user.id)
            color = today["color"]
            text = {"green": "Хороший день!", "yellow": "Умеренный день", "red": "Берегите себя"}[color]
            async with httpx.AsyncClient() as client:
                await client.post("https://exp.host/--/api/v2/push/send", json={
                    "to": user.expo_token, "title": "Доброе утро!", "body": text
                })
