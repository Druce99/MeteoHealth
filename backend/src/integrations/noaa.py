import httpx 
from datetime import datetime, timedelta, timezone

BASE_URL = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"

class NoaaClient:
    async def _fetch(self) -> list[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(BASE_URL)
            response.raise_for_status()
            return response.json()
    
    async def get_current_kp(self) -> float:
        data = await self._fetch()
        return data[-1]["estimated_kp"]

    async def get_daily_kp(self, days: int = 7) -> list[dict]:
        data = await self._fetch()
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        daily: dict[str, list[float]] = {}
        for entry in data:
            dt = datetime.strptime(entry["time_tag"], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
            if dt < cutoff:
                continue
            date = dt.strftime("%Y-%m-%d")
            daily.setdefault(date, []).append(entry["estimated_kp"])

        return [
            {"date": date, "kp_max": round(max(kp_values), 2)}
            for date, kp_values in sorted(daily.items())
        ]