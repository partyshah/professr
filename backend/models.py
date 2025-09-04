from sqlalchemy import Column, Integer, String, DateTime, func
from database import Base

class Ping(Base):
    __tablename__ = "pings"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Ping(id={self.id}, message='{self.message}')>"