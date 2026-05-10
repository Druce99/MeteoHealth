from src.integrations.open_meteo import OpenMeteoClient
from src.integrations.noaa import NoaaClient
from src.repositories.user_repository import UserRepository
from src.core.redis import redis_client as redis
from src.core.exceptions import NotFoundException
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
import json
from datetime import date


class ForecastService:
    def __init__(self, user_repo: UserRepository, db: AsyncSession):
        self.user_repo = user_repo
        self.db = db
        self.meteo = OpenMeteoClient()
        self.noaa = NoaaClient()
        self.redis = redis

    async def get_today(self, user_id: UUID) -> dict:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")

        today_str = date.today().isoformat()
        cache_key = f"forecast:{user.latitude}:{user.longitude}:{today_str}"
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # weather_days[0] = вчера (past_days=1), weather_days[1] = сегодня
        weather_days = await self.meteo.get_forecast(user.latitude, user.longitude)
        kp_days = await self.noaa.get_daily_kp(days=7)

        yesterday = weather_days[0]
        today = weather_days[1]
        kp_today = kp_days[0]["kp_max"] if kp_days else None

        wellness = self._calc_wellness(
            today["pressure"], kp_today, today["temperature"], today["humidity"], user,
            prev_pressure=yesterday["pressure"], prev_temp=yesterday["temperature"],
        )
        color = self._get_color(wellness)

        result = {**today, "kp_index": kp_today, "wellness_index": wellness, "color": color}
        await self.redis.setex(cache_key, 10800, json.dumps(result))
        return result

    async def get_week(self, user_id: UUID) -> dict:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")

        cache_key = f"forecast_week:{user.latitude}:{user.longitude}"
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # weather_days[0] = вчера, weather_days[1..7] = сегодня + 6 дней
        weather_days = await self.meteo.get_forecast(user.latitude, user.longitude)
        kp_days = await self.noaa.get_daily_kp(days=7)
        kp_by_date = {d["date"]: d["kp_max"] for d in kp_days}

        days = []
        for i, day in enumerate(weather_days[1:], start=1):
            prev = weather_days[i - 1]
            kp = kp_by_date.get(day["date"])  # None если нет данных NOAA
            wellness = self._calc_wellness(
                day["pressure"], kp, day["temperature"], day["humidity"], user,
                prev_pressure=prev["pressure"], prev_temp=prev["temperature"],
            )
            days.append({**day, "kp_index": kp, "wellness_index": wellness})

        result = {"days": days}
        await self.redis.setex(cache_key, 10800, json.dumps(result))
        return result

    async def get_by_date(self, user_id: UUID, target_date: date) -> dict:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")

        cache_key = f"forecast:{user.latitude}:{user.longitude}:{target_date.isoformat()}"
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        weather_days = await self.meteo.get_forecast(user.latitude, user.longitude)
        kp_days = await self.noaa.get_daily_kp(days=7)
        kp_by_date = {d["date"]: d["kp_max"] for d in kp_days}

        target_str = target_date.isoformat()
        for i, day in enumerate(weather_days):
            if day["date"] == target_str:
                prev = weather_days[i - 1] if i > 0 else None
                kp = kp_by_date.get(target_str)
                wellness = self._calc_wellness(
                    day["pressure"], kp, day["temperature"], day["humidity"], user,
                    prev_pressure=prev["pressure"] if prev else None,
                    prev_temp=prev["temperature"] if prev else None,
                )
                color = self._get_color(wellness)
                result = {**day, "kp_index": kp, "wellness_index": wellness, "color": color}
                await self.redis.setex(cache_key, 10800, json.dumps(result))
                return result

        raise NotFoundException(f"Прогноз на {target_str} недоступен")

    def _calc_wellness(
        self,
        pressure: float,
        kp: float,
        temperature: float,
        humidity: float,
        user,
        prev_pressure: float | None = None,
        prev_temp: float | None = None,
    ) -> int:
        penalty = 0

        pressure_change = abs(pressure - prev_pressure) if prev_pressure is not None else 0
        if 5 <= pressure_change < 8:
            penalty += 10
        elif pressure_change >= 8:
            penalty += 25

        if kp is not None:
            if 3 <= kp < 5:
                penalty += 10
            elif 5 <= kp < 7:
                penalty += 20
            elif kp >= 7:
                penalty += 35

        temp_change = abs(temperature - prev_temp) if prev_temp is not None else 0
        if 7 <= temp_change < 10:
            penalty += 10
        elif temp_change >= 10:
            penalty += 20

        if humidity > 75 or humidity < 30:
            penalty += 5

        sensitivity = (user.sensitivity_pressure + user.sensitivity_kp + user.sensitivity_temp) / 3
        coefficients = {1: 0.7, 2: 1.0, 3: 1.3}
        coeff = coefficients[round(sensitivity)]
        return max(0, min(100, 100 - int(penalty * coeff)))

    def _get_color(self, wellness: int) -> str:
        if wellness >= 70:
            return "green"
        if wellness >= 40:
            return "yellow"
        return "red"
