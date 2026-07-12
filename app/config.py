from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Banco: SQLite local por padrao, PostgreSQL no Railway via DATABASE_URL
    DATABASE_URL: str = "sqlite:///./marciosys.db"

    # JWT
    SECRET_KEY: str = "troque-esta-chave-em-producao-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 dias

    # GitHub (opcional, para aumentar limite de requisicoes)
    GITHUB_TOKEN: str = ""
    GITHUB_USERNAME: str = "mendes40marcio"

    # CORS - origens do front-end
    FRONTEND_ORIGINS: str = "https://mendes40marcio.github.io,https://marcio-sys-projeto.netlify.app,http://localhost:3000,http://127.0.0.1:5500,null" 

    class Config:
        env_file = ".env"


settings = Settings()
