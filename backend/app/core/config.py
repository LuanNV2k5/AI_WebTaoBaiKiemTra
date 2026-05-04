from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    SECRET_KEY: str = "super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite:///./quiz_system.db"
    # Thêm dòng này cho Groq
    GROQ_API_KEY: str = "mock" 
    APP_NAME: str = "Trắc nghiệm Toán học"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore" 

settings = Settings()