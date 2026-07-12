from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.config import settings
from app.routers import auth, estudos, metas, github

# Cria as tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MARCIO.SYS API",
    description="Back-end do dashboard pessoal MARCIO.SYS",
    version="1.0.0",
)

# CORS - permite o front-end (GitHub Pages / Netlify) chamar a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.FRONTEND_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(estudos.router)
app.include_router(metas.router)
app.include_router(github.router)


@app.get("/", tags=["Health"])
def root():
    return {"sistema": "MARCIO.SYS API", "status": "online", "versao": "1.0.0"}
