from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import WeatherData
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import random
from fastapi import BackgroundTasks

Base.metadata.create_all(bind=engine)

app = FastAPI(redirect_slashes=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class WeatherIn(BaseModel):
    temperature: float
    latitude: float
    longitude: float
    station_name: str

class WeatherOut(WeatherIn):
    id: int
    timestamp: datetime

def generate_random_weather_data(db: Session, count: int = 1000):
    """Генерация случайных данных о погоде"""
    stations = ["Station Alpha", "Station Beta", "Station Gamma", "Station Delta", "Station Epsilon"]
    
    for _ in range(count):
        weather_data = WeatherData(
            station_name=random.choice(stations),
            temperature=round(random.uniform(-20, 40), 2),  # Температура от -20 до 40
            latitude=round(random.uniform(-90, 90), 6),    # Широта
            longitude=round(random.uniform(-180, 180), 6), # Долгота
            timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 365))  # Случайная дата в последний год
        )
        db.add(weather_data)
    
    db.commit()

@app.post("/api/generate-test-data")
async def generate_test_data(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Эндпоинт для генерации тестовых данных"""
    background_tasks.add_task(generate_random_weather_data, db)
    return {"message": "Генерация тестовых данных начата"}

@app.post("/api/weather", response_model=WeatherOut)
def create_weather(data: WeatherIn, db: Session = Depends(get_db)):
    db_data = WeatherData(**data.dict())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

@app.get("/api/weather", response_model=List[WeatherOut])
def read_weather(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    if limit > 100:
        raise HTTPException(status_code=400, detail="Max limit is 100")
    records = db.query(WeatherData).offset(skip).limit(limit).all()
    return records