from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="CareSync_Backend", alias="APP_NAME")
    api_v1_prefix: str = Field(default="/api", alias="API_V1_PREFIX")

    secret_key: str = Field(default="dev-secret-key", alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    database_url: str = Field(default="sqlite:///./caresync.db", alias="DATABASE_URL")
    sqlalchemy_echo: bool = Field(default=False, alias="SQLALCHEMY_ECHO")
    bootstrap_demo_data: bool = Field(default=True, alias="BOOTSTRAP_DEMO_DATA")

    # CORS origins allowed for cross-origin requests from the frontend.
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "exp://127.0.0.1:19000",
        # Physical device on school WiFi
        "http://10.231.28.226:5173",
        "http://10.231.28.226:19006",
        "http://10.231.28.226:8081",
        "exp://10.231.28.226:19000",
    ]


    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", populate_by_name=True)


settings = Settings()
