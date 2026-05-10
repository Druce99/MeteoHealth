import pytest
from httpx import AsyncClient

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

async def test_create_user(client: AsyncClient):
    response = await client.post("/api/v1/users/", json=USER_DATA)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Иван Иванов"
    assert data["age_group"] == "18_35"
    assert "id" in data

async def test_get_user(client: AsyncClient):
    create = await client.post("/api/v1/users/", json=USER_DATA)
    user_id = create.json()["id"]
    
    response = await client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200
    assert response.json()["id"] == user_id

async def test_get_user_not_found(client: AsyncClient):
    response = await client.get("/api/v1/users/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
