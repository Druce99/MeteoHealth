import httpx
from src.core.redis import broker
from src.core.database import async_session_maker
from src.repositories.user_repository import UserRepository
from src.repositories.notification_settings_repository import NotificationSettingsRepository
from src.services.forecast_service import ForecastService


@broker.subscriber("digest:send")
async def send_digest(_: str = ""):
    async with async_session_maker() as db:
        user_repo = UserRepository(db)
        settings_repo = NotificationSettingsRepository(db)
        users = await user_repo.get_all()

        for user in users:
            if not user.expo_token:
                continue

            settings = await settings_repo.get_by_user_id(user.id)
            if not settings or not settings.digest_enabled:
                continue

            forecast_service = ForecastService(user_repo, db)
            today = await forecast_service.get_today(user.id)

            color = today["color"]
            wellness = today["wellness_index"]
            body = {
                "green": f"Индекс благополучия {wellness} — хороший день!",
                "yellow": f"Индекс благополучия {wellness} — умеренный день, будьте внимательны.",
                "red": f"Индекс благополучия {wellness} — неблагоприятный день. Берегите себя.",
            }[color]

            async with httpx.AsyncClient() as client:
                await client.post("https://exp.host/--/api/v2/push/send", json={
                    "to": user.expo_token,
                    "title": "Доброе утро!",
                    "body": body,
                    "sound": "default",
                })
