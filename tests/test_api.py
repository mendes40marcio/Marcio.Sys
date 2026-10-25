"""Testes da API MARCIO.SYS. Rodar com: pytest -q"""
import os

os.environ["DATABASE_URL"] = "sqlite:///./teste.db"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def banco_limpo():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def auth():
    client.post("/auth/register", json={"username": "marcio", "password": "senha-forte-123"})
    r = client.post("/auth/login", data={"username": "marcio", "password": "senha-forte-123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "online"


def test_senha_curta_rejeitada():
    r = client.post("/auth/register", json={"username": "ana", "password": "123"})
    assert r.status_code == 422


def test_login_errado():
    r = client.post("/auth/login", data={"username": "ninguem", "password": "x"})
    assert r.status_code == 401


def test_rota_protegida_sem_token():
    assert client.get("/estudos").status_code == 401


def test_token_invalido_da_401():
    r = client.get("/estudos", headers={"Authorization": "Bearer lixo"})
    assert r.status_code == 401


def test_crud_estudo(auth):
    r = client.post("/estudos", json={"curso": "  Python   Avancado ", "horas": 10, "plataforma": "DIO"}, headers=auth)
    assert r.status_code == 201
    estudo = r.json()
    assert estudo["curso"] == "Python Avancado"

    r = client.patch(f"/estudos/{estudo['id']}/horas?horas=2", headers=auth)
    assert r.json()["horas"] == 12

    r = client.patch(f"/estudos/{estudo['id']}", json={"curso": "Python"}, headers=auth)
    assert r.json()["curso"] == "Python"

    assert client.delete(f"/estudos/{estudo['id']}", headers=auth).status_code == 204
    assert client.get("/estudos", headers=auth).json() == []


def test_validacoes_estudo(auth):
    assert client.post("/estudos", json={"curso": "   "}, headers=auth).status_code == 422
    assert client.post("/estudos", json={"curso": "X", "horas": -5}, headers=auth).status_code == 422
    assert client.post("/estudos", json={"curso": "X", "tipo": "hack"}, headers=auth).status_code == 422
    e = client.post("/estudos", json={"curso": "X"}, headers=auth).json()
    assert client.patch(f"/estudos/{e['id']}/horas?horas=0", headers=auth).status_code == 422
    assert client.patch(f"/estudos/{e['id']}/horas?horas=99", headers=auth).status_code == 422


def test_resumo_separa_complementares(auth):
    client.post("/estudos", json={"curso": "Google IT", "horas": 240, "plataforma": "Coursera"}, headers=auth)
    client.post("/estudos", json={"curso": "Git", "horas": 30, "plataforma": "DIO", "status": "concluido"}, headers=auth)
    client.post("/estudos", json={"curso": "Horas complementares", "horas": 170, "tipo": "complementar"}, headers=auth)
    r = client.get("/estudos/resumo", headers=auth).json()
    assert r["total_horas"] == 440
    assert r["horas_cursos"] == 270
    assert r["horas_complementares"] == 170
    assert r["cursos"] == 2
    assert r["concluidos"] == 1
    assert "Horas complementares" not in r["por_curso"]
    assert r["por_plataforma"] == {"Coursera": 240, "DIO": 30}


def test_usuario_nao_ve_dados_de_outro(auth):
    e = client.post("/estudos", json={"curso": "Secreto"}, headers=auth).json()
    client.post("/auth/register", json={"username": "outro", "password": "senha-forte-456"})
    tok = client.post("/auth/login", data={"username": "outro", "password": "senha-forte-456"}).json()["access_token"]
    outro = {"Authorization": f"Bearer {tok}"}
    assert client.get("/estudos", headers=outro).json() == []
    assert client.delete(f"/estudos/{e['id']}", headers=outro).status_code == 404


def test_meta_vira_conquista_e_reabre(auth):
    m = client.post("/metas", json={"titulo": "Certificacao Python"}, headers=auth).json()
    r = client.patch(f"/metas/{m['id']}", json={"progresso": 100}, headers=auth).json()
    assert r["concluida"] is True and r["concluida_em"]
    assert len(client.get("/metas/conquistas", headers=auth).json()) == 1

    r = client.patch(f"/metas/{m['id']}", json={"concluida": False}, headers=auth).json()
    assert r["concluida"] is False and r["concluida_em"] is None and r["progresso"] == 90

    assert client.delete(f"/metas/{m['id']}", headers=auth).status_code == 204


def test_painel_servido_com_csp():
    r = client.get("/")
    assert r.status_code == 200
    assert "text/html" in r.headers["content-type"]
    csp = r.headers["content-security-policy"]
    assert "script-src 'self'" in csp and "frame-ancestors 'none'" in csp
    assert client.get("/assets/js/main.js").status_code == 200


def test_cors_nao_aceita_origem_null():
    r = client.options("/estudos", headers={"Origin": "null", "Access-Control-Request-Method": "GET"})
    assert r.headers.get("access-control-allow-origin") != "null"


def teardown_module():
    engine.dispose()
    if os.path.exists("teste.db"):
        os.remove("teste.db")
