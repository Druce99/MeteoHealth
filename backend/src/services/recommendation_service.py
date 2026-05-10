from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.recommendation_repository import RecommendationRepository
from src.repositories.user_repository import UserRepository
from src.integrations.open_meteo import OpenMeteoClient
from src.integrations.noaa import NoaaClient
from src.models.recommendation import Recommendation
from src.models.enums import WeatherTrigger
from src.core.exceptions import NotFoundException


class RecommendationService:
    def __init__(self, recommendation_repo: RecommendationRepository, user_repo: UserRepository, db: AsyncSession):
        self.recommendation_repo = recommendation_repo
        self.user_repo = user_repo
        self.db = db

    async def get_today_recommendations(self, user_id: UUID) -> list[Recommendation]:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")

        meteo = OpenMeteoClient()
        noaa = NoaaClient()
        weather_days = await meteo.get_forecast(user.latitude, user.longitude)
        kp_days = await noaa.get_daily_kp(days=7)

        yesterday = weather_days[0]
        today = weather_days[1]
        kp_today = kp_days[0]["kp_max"] if kp_days else None

        triggers = self._detect_triggers(today, yesterday, kp_today)

        result = []
        for condition in user.conditions:
            for trigger in triggers:
                recs = await self.recommendation_repo.get_by_condition_and_trigger(condition, trigger)
                result.extend(recs)
        return result

    def _detect_triggers(self, today: dict, yesterday: dict, kp: float | None) -> list[WeatherTrigger]:
        triggers = []

        pressure_change = today["pressure"] - yesterday["pressure"]
        if pressure_change <= -3:
            triggers.append(WeatherTrigger.PRESSURE_DOWN)
        elif pressure_change >= 3:
            triggers.append(WeatherTrigger.PRESSURE_UP)

        if kp is not None and kp >= 3:
            triggers.append(WeatherTrigger.MAGNETIC_STORM)

        temp_change = abs(today["temperature"] - yesterday["temperature"])
        if temp_change >= 5:
            triggers.append(WeatherTrigger.TEMPERATURE)

        if today["humidity"] > 75 or today["humidity"] < 30:
            triggers.append(WeatherTrigger.HUMIDITY)

        return triggers

    async def get_all_recommendations(self) -> list[Recommendation]:
        return await self.recommendation_repo.get_all()