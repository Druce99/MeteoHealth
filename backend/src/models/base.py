from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid
from src.core.database import Base

class BaseModel(Base):
    __abstract__ = True
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)