import pytest
from httpx import AsyncClient
from datetime import date

USER_DATA = {
    "name": "Иван Иванов",
    "age_group": "18_35",
    "location_name": "Москва",
    "latitude": 55.7558,
    "longitude": 37.6173,
    "conditions": ["hypotension"],
    "sensitivity_pressure": 2,
    "sensitivity_kp": 2,
    "sensitivity_temp": 2,
    "expo_token": None
}

DIARY_DATA = {
    "entry_date": str(date.today()),
    "wellbeing_score": 7,
    "symptoms": ["headache", "fatigue"],
    "note": "Болела голова с утра"
}


async def test_create_diary_entry(client: AsyncClient):
    user = await client.post("/api/v1/users/", json=USER_DATA)
    user_id = user.json()["id"]

    response = await client.post(f"/api/v1/diary/{user_id}", json=DIARY_DATA)
    assert response.status_code == 201
    data = response.json()
    assert data["wellbeing_score"] == 7
    assert data["user_id"] == user_id


async def test_get_diary_entries(client: AsyncClient):
    user = await client.post("/api/v1/users/", json=USER_DATA)
    user_id = user.json()["id"]
    await client.post(f"/api/v1/diary/{user_id}", json=DIARY_DATA)

    response = await client.get(f"/api/v1/diary/{user_id}")
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_get_diary_entry_by_date(client: AsyncClient):
    user = await client.post("/api/v1/users/", json=USER_DATA)
    user_id = user.json()["id"]
    await client.post(f"/api/v1/diary/{user_id}", json=DIARY_DATA)

    response = await client.get(f"/api/v1/diary/{user_id}/{date.today()}")
    assert response.status_code == 200
    assert response.json()["wellbeing_score"] == 7


async def test_get_diary_entry_not_found(client: AsyncClient):
    user = await client.post("/api/v1/users/", json=USER_DATA)
    user_id = user.json()["id"]

    response = await client.get(f"/api/v1/diary/{user_id}/2000-01-01")
    assert response.status_code == 404
