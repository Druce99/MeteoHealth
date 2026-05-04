import httpx
BASE_URL = "https://api.open-meteo.com/v1/forecast"

class OpenMeteoClient:
    async def get_forecast(self, lat: float, lon: float) -> list[dict]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "surface_pressure,temperature_2m,relative_humidity_2m",
            "forecast_days": 7,
            "timezone": "auto",
        }
    
        async with httpx.AsyncClient() as client:
            response = await client.get(BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
        
        return self._parse(data)
    
    def _parse(self, data: dict) -> list[dict]:
        hourly = data["hourly"]
        
        daily: dict[str, list] = {}
        for time, pressure, temperature, humidity in zip(
            hourly["time"],
            hourly["surface_pressure"],
            hourly["temperature_2m"],
            hourly["relative_humidity_2m"],
        ):
            date = time[:10]  # "2026-05-03T00:00" → "2026-05-03"
            if date not in daily:
                daily[date] = {"pressure": [], "temperature": [], "humidity": []}
            daily[date]["pressure"].append(pressure * 0.750064)
            daily[date]["temperature"].append(temperature)
            daily[date]["humidity"].append(humidity)
        
        return [
            {
                "date": date,
                "pressure": round(sum(v["pressure"]) / len(v["pressure"]), 1),
                "temperature": round(sum(v["temperature"]) / len(v["temperature"]), 1),
                "humidity": round(sum(v["humidity"]) / len(v["humidity"]), 1),
            }
            for date, v in daily.items()
        ]

