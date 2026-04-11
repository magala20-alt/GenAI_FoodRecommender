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
    admin_email: str = Field(default="admin@caresync.com", alias="ADMIN_EMAIL")
    admin_password: str = Field(default="Admin@12345", alias="ADMIN_PASSWORD")
    admin_first_name: str = Field(default="System", alias="ADMIN_FIRST_NAME")
    admin_last_name: str = Field(default="Administrator", alias="ADMIN_LAST_NAME")
    clinician_default_password: str = Field(default="Doctor@12345", alias="CLINICIAN_DEFAULT_PASSWORD")
    password_reset_frontend_url: str = Field(default="http://localhost:5173/reset-password", alias="PASSWORD_RESET_FRONTEND_URL")
    email_from_address: str = Field(default="noreply@caresync.local", alias="EMAIL_FROM_ADDRESS")
    smtp_host: str = Field(default="", alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_username: str = Field(default="", alias="SMTP_USERNAME")
    smtp_password: str = Field(default="", alias="SMTP_PASSWORD")
    smtp_use_tls: bool = Field(default=True, alias="SMTP_USE_TLS")

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
    cors_origin_regex: str = Field(
        default=r"^https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$",
        alias="CORS_ORIGIN_REGEX",
    )

    # RAG & LLM Configuration
    llm_provider: str = Field(default="gemini", alias="LLM_PROVIDER")  # "gemini" or "openai"
    llm_api_key: str = Field(default="", alias="LLM_API_KEY")
    llm_model: str = Field(default="gemini-2.5-flash", alias="LLM_MODEL")
    llm_temperature: float = Field(default=0.7, alias="LLM_TEMPERATURE")
    embedding_model: str = Field(default="all-MiniLM-L6-v2", alias="EMBEDDING_MODEL")  # HuggingFace model
    vector_db_dimension: int = Field(default=384, alias="VECTOR_DB_DIMENSION")
    max_retrieved_items: int = Field(default=5, alias="MAX_RETRIEVED_ITEMS")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", populate_by_name=True)


settings = Settings()
