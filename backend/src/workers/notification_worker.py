import httpx
from datetime import datetime, timezone
from src.core.redis import broker
from src.core.database import async_session_maker
from src.repositories.user_repository import UserRepository
from src.repositories.notification_settings_repository import NotificationSettingsRepository
from src.services.forecast_service import ForecastService


@broker.subscriber("notification:check")
async def check_notifications(_: str = ""):
    async with async_session_maker() as db:
        user_repo = UserRepository(db)
        settings_repo = NotificationSettingsRepository(db)
        users = await user_repo.get_all()

        for user in users:
            if not user.expo_token:
                continue

            settings = await settings_repo.get_by_user_id(user.id)
            if not settings:
                continue

            if _is_quiet_time(settings.quiet_from, settings.quiet_to):
                continue

            forecast_service = ForecastService(user_repo, db)
            today = await forecast_service.get_today(user.id)

            messages = _build_messages(today, settings)
            for title, body in messages:
                await _send_push(user.expo_token, title, body)


def _is_quiet_time(quiet_from, quiet_to) -> bool:
    now = datetime.now(timezone.utc).time().replace(tzinfo=None)
    if quiet_from <= quiet_to:
        return quiet_from <= now <= quiet_to
    return now >= quiet_from or now <= quiet_to


def _build_messages(forecast: dict, settings) -> list[tuple[str, str]]:
    messages = []

    if settings.notify_pressure and forecast.get("wellness_index", 100) < 40:
        messages.append(("Давление", "Резкое изменение атмосферного давления — берегите себя"))

    kp = forecast.get("kp_index")
    if settings.notify_kp and kp is not None and kp >= settings.kp_threshold:
        messages.append(("Магнитная буря", f"Kp-индекс {kp} — возможно ухудшение самочувствия"))

    if settings.notify_humidity:
        humidity = forecast.get("humidity", 50)
        if humidity > 75 or humidity < 30:
            messages.append(("Влажность", f"Влажность {humidity}% — некомфортные условия"))

    return messages


async def _send_push(token: str, title: str, body: str):
    async with httpx.AsyncClient() as client:
        await client.post("https://exp.host/--/api/v2/push/send", json={
            "to": token, "title": title, "body": body,
            "sound": "default",
        })
