from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
import os
import time
import pymysql

DB_USER = os.getenv("DB_USER", "user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_NAME = os.getenv("DB_NAME", "weatherdb")
DB_HOST = os.getenv("DB_HOST", "db")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?charset=utf8mb4"

def create_engine_with_retry():
    max_retries = 10
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                pool_pre_ping=True,
                connect_args={
                    "connect_timeout": 10,
                }
            )
            # Исправленный способ проверки подключения
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return engine
        except (OperationalError, pymysql.Error) as e:
            if attempt == max_retries - 1:
                raise
            print(f"Connection failed, retrying in {retry_delay} seconds... (attempt {attempt + 1}/{max_retries})")
            time.sleep(retry_delay)

engine = create_engine_with_retry()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()