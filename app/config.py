import os

from pydantic_settings import BaseSettings, SettingsConfigDict

CHAVE_PADRAO = "troque-esta-chave-em-producao-use-openssl-rand-hex-32"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Banco: SQLite local por padrao, PostgreSQL no Railway via DATABASE_URL
    DATABASE_URL: str = "sqlite:///./marciosys.db"

    # JWT
    SECRET_KEY: str = CHAVE_PADRAO
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 dia

    # GitHub (opcional, para aumentar limite de requisicoes)
    GITHUB_TOKEN: str = ""
    GITHUB_USERNAME: str = "mendes40marcio"

    # CORS - origens do front-end hospedado em outro dominio.
    # Quando o front e servido pela propria API (pasta frontend/), nao precisa de CORS.
    FRONTEND_ORIGINS: str = (
        "https://mendes40marcio.github.io,"
        "https://marcio-sys-projeto.netlify.app,"
        "http://localhost:8000,http://127.0.0.1:8000,"
        "http://localhost:5500,http://127.0.0.1:5500"
    )

    # Permite cadastro de novos usuarios. Em producao, desligue depois de criar o seu.
    ALLOW_REGISTER: bool = True

    @property
    def em_producao(self) -> bool:
        return bool(os.getenv("RAILWAY_ENVIRONMENT")) or self.DATABASE_URL.startswith("postgres")

    @property
    def origens(self) -> list[str]:
        return [o.strip() for o in self.FRONTEND_ORIGINS.split(",") if o.strip()]


settings = Settings()

if settings.em_producao and settings.SECRET_KEY == CHAVE_PADRAO:
    raise RuntimeError(
        "SECRET_KEY padrao em producao. Gere uma com `openssl rand -hex 32` "
        "e configure em Variables no Railway."
    )
