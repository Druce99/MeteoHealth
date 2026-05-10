import httpx
from datetime import datetime, timedelta, timezone

HISTORICAL_URL = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
FORECAST_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"

class NoaaClient:
    async def _fetch_historical(self) -> list[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(HISTORICAL_URL)
            response.raise_for_status()
            return response.json()

    async def _fetch_forecast(self) -> list[list]:
        async with httpx.AsyncClient() as client:
            response = await client.get(FORECAST_URL)
            response.raise_for_status()
            return response.json()

    async def get_current_kp(self) -> float:
        data = await self._fetch_historical()
        return data[-1]["estimated_kp"]

    async def get_daily_kp(self, days: int = 7) -> list[dict]:
        daily: dict[str, list[float]] = {}

        # исторические данные за последние 24 часа
        try:
            historical = await self._fetch_historical()
            cutoff = datetime.now(timezone.utc) - timedelta(days=1)
            for entry in historical:
                try:
                    dt = datetime.strptime(entry["time_tag"], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
                    if dt < cutoff:
                        continue
                    day_str = dt.strftime("%Y-%m-%d")
                    kp_val = float(entry["estimated_kp"])
                    daily.setdefault(day_str, []).append(kp_val)
                except (ValueError, TypeError, KeyError):
                    continue
        except Exception:
            pass

        # прогноз на 3 дня вперёд
        try:
            forecast_raw = await self._fetch_forecast()
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            for row in forecast_raw[1:]:  # пропускаем заголовок
                if len(row) < 3:
                    continue
                time_tag = row[0]
                kp_str = row[1]
                observed = row[2]
                # "observed" — уже в исторических данных, пропускаем
                if str(observed).lower() == "observed":
                    continue
                try:
                    dt = datetime.strptime(time_tag, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
                    day_str = dt.strftime("%Y-%m-%d")
                    if day_str >= today:
                        kp_val = float(kp_str)
                        if kp_val >= 0:  # отбрасываем невалидные sentinel-значения
                            daily.setdefault(day_str, []).append(kp_val)
                except (ValueError, TypeError):
                    continue
        except Exception:
            pass

        return [
            {"date": day_str, "kp_max": round(max(kp_values), 2)}
            for day_str, kp_values in sorted(daily.items())
        ]
