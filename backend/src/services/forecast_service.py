from src.integrations.open_meteo import OpenMeteoClient
from src.integrations.noaa import NoaaClient
from src.repositories.user_repository import UserRepository
from src.core.redis import redis_client as redis
from src.core.exceptions import NotFoundException
from uuid  import UUID
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
        
        weather_days = await self.meteo.get_forecast(user.latitude, user.longitude)
        kp_days = await self.noaa.get_daily_kp(days=7)
        
        today = weather_days[0]
        kp_today = kp_days[0]["kp_max"] if kp_days else 0.0
        
        wellness = self._calc_wellness(today["pressure"], kp_today, today["temperature"], today["humidity"], user)
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
        
        weather_days = await self.meteo.get_forecast(user.latitude, user.longitude)
        kp_days = await self.noaa.get_daily_kp(days=7)
        kp_by_date = {d["date"]: d["kp_max"] for d in kp_days}
        days = []
        for day in weather_days:
            kp = kp_by_date.get(day["date"], 0.0)
            wellness = self._calc_wellness(day["pressure"], kp, day["temperature"], day["humidity"], user)
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
        day = next((d for d in weather_days if d["date"] == target_str), None)
        if not day:
            raise NotFoundException(f"Прогноз на {target_str} недоступен")
        kp = kp_by_date.get(target_str, 0.0)
        wellness = self._calc_wellness(day["pressure"], kp, day["temperature"], day["humidity"], user)
        color = self._get_color(wellness)
        result = {**day, "kp_index": kp, "wellness_index": wellness, "color": color}
        await self.redis.setex(cache_key, 10800, json.dumps(result))
        return result

    def _calc_wellness(self, pressure: float, kp: float, temperature: float, humidity: float, user) -> int:
        penalty = 0
        # штраф за давление (изменение за 6ч — у нас дневное среднее, берём упрощённо)
        # pressure_change — пока заглушка 0, потом можно улучшить
        pressure_change = 0
        if 5 <= pressure_change < 8:
            penalty += 10
        elif pressure_change >= 8:
            penalty += 25
        # штраф за Kp
        if 3 <= kp < 5:
            penalty += 10
        elif 5 <= kp < 7:
            penalty += 20
        elif kp >= 7:
            penalty += 35
        # штраф за температуру (перепад — тоже заглушка 0 пока)
        temp_change = 0
        if 7 <= temp_change < 10:
            penalty += 10
        elif temp_change >= 10:
            penalty += 20
        # штраф за влажность
        if humidity > 75 or humidity < 30:
            penalty += 5
        # коэффициент чувствительности (среднее по трём параметрам)
        sensitivity = (user.sensitivity_pressure + user.sensitivity_kp + user.sensitivity_temp) / 3
        coefficients = {1: 0.7, 2: 1.0, 3: 1.3}
        coeff = coefficients[round(sensitivity)]
        result = 100 - int(penalty * coeff)
        return max(0, min(100, result))
    
    def _get_color(self, wellness: int) -> str:
        if wellness >= 70:
            return "green"
        if wellness >= 40:
            return "yellow"
        return "red"