from fastapi import APIRouter, HTTPException
import httpx

from app.config import settings

router = APIRouter(prefix="/github", tags=["GitHub"])

BASE = "https://api.github.com"


def _headers():
    h = {"Accept": "application/vnd.github+json"}
    if settings.GITHUB_TOKEN:
        h["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return h


@router.get("/perfil")
async def perfil(username: str = ""):
    user = username or settings.GITHUB_USERNAME
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{BASE}/users/{user}", headers=_headers())
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail="Usuario GitHub nao encontrado")
    d = r.json()
    return {
        "login": d["login"],
        "nome": d.get("name"),
        "avatar": d.get("avatar_url"),
        "repos_publicos": d.get("public_repos"),
        "seguidores": d.get("followers"),
        "bio": d.get("bio"),
        "url": d.get("html_url"),
    }


@router.get("/repos")
async def repos(username: str = ""):
    user = username or settings.GITHUB_USERNAME
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{BASE}/users/{user}/repos",
            headers=_headers(),
            params={"sort": "updated", "per_page": 30},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail="Erro ao buscar repos")
    return [
        {
            "nome": repo["name"],
            "descricao": repo.get("description"),
            "linguagem": repo.get("language"),
            "stars": repo.get("stargazers_count"),
            "url": repo.get("html_url"),
            "atualizado": repo.get("updated_at"),
        }
        for repo in r.json()
    ]
