from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import WeatherData
from pydantic import BaseModel
from typing import List

Base.metadata.create_all(bind=engine)

app = FastAPI()

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
    timestamp: str

@app.post("/weather/", response_model=WeatherOut)
def create_weather(data: WeatherIn, db: Session = Depends(get_db)):
    db_data = WeatherData(**data.dict())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

@app.get("/weather/", response_model=List[WeatherOut])
def read_weather(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    if limit > 100:
        raise HTTPException(status_code=400, detail="Max limit is 100")
    records = db.query(WeatherData).offset(skip).limit(limit).all()
    return records