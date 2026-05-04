from fastapi import APIRouter

from .users import router as users_router
from .diary import router as diary_router
from .recommendations import router as recommendations_router
from .notification_settings import router as notification_settings_router
from .forecast import router as forecast_router
from .ml import router as ml_router

api_router = APIRouter()

api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(diary_router, prefix="/diary", tags=["diary"])
api_router.include_router(recommendations_router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(notification_settings_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(forecast_router, prefix="/forecast", tags=["forecast"])
api_router.include_router(ml_router, prefix="/ml", tags=["ml"])
