from faststream.redis import RedisBroker
from .config import settings
from redis.asyncio import Redis

broker = RedisBroker(settings.REDIS_URL)
redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)