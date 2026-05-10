import asyncio
from datetime import datetime, timedelta
from faststream import FastStream
from src.core.redis import broker

app = FastStream(broker)

from src.workers.weather_worker import update_weather
from src.workers.notification_worker import check_notifications
from src.workers.digest_worker import send_digest
from src.workers import ml_worker  # noqa: F401 — регистрирует subscriber


async def _run_every_hours(hours: int, coro_func, *args) -> None:
    """Запускает coroutine раз в N часов (первый запуск — через N часов)."""
    while True:
        await asyncio.sleep(hours * 3600)
        try:
            await coro_func(*args)
        except Exception:
            pass


async def _run_daily_at(hour: int, minute: int, coro_func, *args) -> None:
    """Запускает coroutine каждый день в заданное время."""
    while True:
        now = datetime.now()
        target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if target <= now:
            target += timedelta(days=1)
        await asyncio.sleep((target - now).total_seconds())
        try:
            await coro_func(*args)
        except Exception:
            pass


@app.on_startup
async def start_schedulers() -> None:
    asyncio.create_task(_run_every_hours(3, update_weather, ""))       # каждые 3ч
    asyncio.create_task(_run_every_hours(3, check_notifications, ""))  # каждые 3ч
    asyncio.create_task(_run_daily_at(8, 0, send_digest, ""))          # ежедневно 08:00
