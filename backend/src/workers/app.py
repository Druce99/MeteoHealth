from faststream import FastStream
from src.core.redis import broker

app = FastStream(broker)

from src.workers import weather_worker, notification_worker, digest_worker, ml_worker
