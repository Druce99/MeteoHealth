from fastapi import FastAPI
from src.core.config import settings
from contextlib import asynccontextmanager


from src.core.database import async_engine
from src.core.redis import broker
from src.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await broker.start()
    yield
    await async_engine.dispose()
    await broker.stop()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.include_router(api_router, prefix="/api/v1")