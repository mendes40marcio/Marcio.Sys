from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import auth, disciplinas, estudos, github, metas

VERSAO = "1.2.0"
FRONTEND = Path(__file__).resolve().parent.parent / "frontend"

# Cria as tabelas (proximo passo: migrations com alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MARCIO.SYS API",
    description="Back-end do dashboard pessoal MARCIO.SYS",
    version=VERSAO,
)

# CORS so e necessario quando o front roda em outro dominio (GitHub Pages, Netlify).
# O token vai no header Authorization, entao nao usamos cookies/credenciais.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origens,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Tudo (scripts, fontes, Chart.js) e servido pelo proprio projeto,
# entao a politica so libera 'self'. Estilos inline sao usados nas barras de progresso.
CSP = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; "
    "font-src 'self'; "
    "img-src 'self' data:; "
    "connect-src 'self'; "
    "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
)


@app.middleware("http")
async def cabecalhos_de_seguranca(request: Request, call_next):
    resposta = await call_next(request)
    resposta.headers.setdefault("X-Content-Type-Options", "nosniff")
    resposta.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    if resposta.headers.get("content-type", "").startswith("text/html") and not request.url.path.startswith(("/docs", "/redoc")):
        resposta.headers.setdefault("Content-Security-Policy", CSP)
    return resposta


app.include_router(auth.router)
app.include_router(estudos.router)
app.include_router(metas.router)
app.include_router(github.router)
app.include_router(disciplinas.router)


@app.get("/health", tags=["Health"])
def health():
    return {"sistema": "MARCIO.SYS API", "status": "online", "versao": VERSAO}


# Front-end servido pela propria API: mesmo endereco, sem CORS e sem abrir file://
if (FRONTEND / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND / "assets"), name="assets")

    @app.get("/", include_in_schema=False)
    def painel():
        return FileResponse(FRONTEND / "index.html")
else:

    @app.get("/", tags=["Health"])
    def root():
        return health()
