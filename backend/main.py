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
    """Генерация данных с четкими температурными зонами"""
    stations = ["Station Alpha", "Station Beta", "Station Gamma", "Station Delta", "Station Epsilon"]
    
    for _ in range(count):
        latitude = round(random.uniform(-90, 90), 6)
        
        # Усиленные температурные различия
        if abs(latitude) < 23.5:  # Тропики
            base_temp = random.uniform(25, 40)
        elif abs(latitude) < 45:   # Умеренный пояс
            base_temp = random.uniform(5, 25)
        elif abs(latitude) < 66.5: # Субполярный пояс
            base_temp = random.uniform(-15, 10)
        else:                      # Полярный пояс
            base_temp = random.uniform(-30, -5)
        
        # Сезонные колебания
        now = datetime.utcnow()
        is_summer = (now.month in [6,7,8] and latitude > 0) or (now.month in [12,1,2] and latitude < 0)
        temp_variation = random.uniform(0, 10) if is_summer else random.uniform(-10, 0)
        
        weather_data = WeatherData(
            station_name=random.choice(stations),
            temperature=round(base_temp + temp_variation, 2),
            latitude=latitude,
            longitude=round(random.uniform(-180, 180), 6),
            timestamp=now - timedelta(days=random.randint(0, 365))
        )
        db.add(weather_data)
    
    db.commit()

@app.post("/api/generate-test-data")
async def generate_test_data(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
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
    return db.query(WeatherData).offset(skip).limit(limit).all()

@app.get("/api/weather/heatmap")
def get_heatmap_data(db: Session = Depends(get_db)):
    return [
        {
            "latitude": r.latitude,
            "longitude": r.longitude,
            "temperature": r.temperature
        } for r in db.query(WeatherData).all()
    ]