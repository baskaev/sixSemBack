from sqlalchemy import Column, Integer, Float, String, DateTime
from database import Base
from datetime import datetime

class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    temperature = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    station_name = Column(String(255))
    timestamp = Column(DateTime, default=datetime.utcnow)