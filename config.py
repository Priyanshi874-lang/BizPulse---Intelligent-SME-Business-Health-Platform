import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Defaulting to an SQLite database for rapid local Hackathon development.
    # To use MySQL as requested, simply set the DATABASE_URL environment variable:
    # e.g., DATABASE_URL="mysql+pymysql://user:password@localhost/bizpulse"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./bizpulse.db")

settings = Settings()
