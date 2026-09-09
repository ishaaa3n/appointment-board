import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Defaults to a local SQLite file so the app runs with zero setup.
# Point DATABASE_URL at Postgres/MySQL instead, e.g.:
#   postgresql://user:password@localhost:5432/appointments
#   mysql+pymysql://user:password@localhost:3306/appointments
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./appointments.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
