import json
from faststream import FastStream

from src.core.redis import broker, redis_client
from src.core.database import async_session_maker
from src.repositories.user_repository import UserRepository
from src.integrations.open_meteo import OpenMeteoClient
from src.integrations.noaa import NoaaClient

app = FastStream(broker)

@broker.subscriber("weather:update")
async def update_weather(_: str = ""):
    async with async_session_maker() as db:
        user_repo = UserRepository(db)
        users = await user_repo.get_all()
    
    meteo = OpenMeteoClient()
    noaa = NoaaClient()
    
    for user in users:
        weather_days = await meteo.get_forecast(user.latitude, user.longitude)
        kp_days = await noaa.get_daily_kp(days=7)
        kp_by_date = {d["date"]: d["kp_max"] for d in kp_days}
        
        for day in weather_days:
            kp = kp_by_date.get(day["date"], 0.0)
            cache_key = f"forecast:{user.latitude}:{user.longitude}:{day['date']}"
            await redis_client.setex(cache_key, 10800, json.dumps({**day, "kp_index":kp}))
