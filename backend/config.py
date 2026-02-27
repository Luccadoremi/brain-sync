from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    access_token: str
    qwen_api_key: str
    qwen_api_base: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    qwen_model: str = "qwen-plus"
    database_url: str = "sqlite:///./brain_sync.db"
    rss_fetch_interval_hours: int = 6  # RSS fetch interval in hours
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
