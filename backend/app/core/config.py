from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DB_HOST: str
    DB_DATABASE: str
    DB_USER: str
    DB_PASSWORD: str
    DB_SSLMODE: str = "require"
    DB_CHANNELBINDING: str = "require"

    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_DAYS: int = 7

    # Backblaze B2
    B2_KEY_ID: str
    B2_APPLICATION_KEY: str
    B2_BUCKET_NAME: str
    B2_ENDPOINT_URL: str

    # App
    CORS_ORIGINS: str = "http://localhost:3000"
    ENV: str = "production"  # override to "development" in local .env

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"

    @property
    def DATABASE_URL(self) -> str:  # noqa: N802 — keep uppercase to match pydantic-settings convention
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}/{self.DB_DATABASE}"
            f"?ssl={self.DB_SSLMODE}"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = {
        "env_file": Path(__file__).resolve().parent.parent.parent / ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
