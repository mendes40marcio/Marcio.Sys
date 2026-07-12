# MARCIO.SYS — Back-end (FastAPI)

Back-end do dashboard pessoal MARCIO.SYS. Autenticação JWT, progresso de estudos, metas/conquistas e integração com GitHub.

## Stack
- **FastAPI** + **Uvicorn**
- **SQLAlchemy** (SQLite local / PostgreSQL em produção)
- **JWT** (python-jose) + **bcrypt** para senhas
- **httpx** para integração com a API do GitHub

## Estrutura
```
app/
├── main.py          # app principal + CORS + rotas
├── config.py        # configurações (env vars)
├── database.py      # conexão com o banco
├── models.py        # tabelas (User, Estudo, Meta)
├── schemas.py       # validação Pydantic
├── security.py      # hash de senha + JWT
└── routers/
    ├── auth.py      # /auth (register, login, me)
    ├── estudos.py   # /estudos (CRUD + resumo)
    ├── metas.py     # /metas (CRUD + conquistas)
    └── github.py    # /github (perfil, repos)
```

## Rodar local

```bash
python -m venv .venv
source .venv/bin/activate          # Linux/Mac (seu Ubuntu)
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Acesse a documentação interativa em **http://127.0.0.1:8000/docs** (Swagger gerado automático — ótimo pra testar).

## Endpoints principais

| Método | Rota | O que faz |
|--------|------|-----------|
| POST | `/auth/register` | Cria usuário |
| POST | `/auth/login` | Retorna token JWT |
| GET | `/auth/me` | Dados do usuário logado |
| GET/POST | `/estudos` | Lista / cria estudos |
| PATCH | `/estudos/{id}/horas` | Adiciona horas |
| GET | `/estudos/resumo` | Total de horas por curso |
| GET/POST | `/metas` | Lista / cria metas |
| PATCH | `/metas/{id}` | Atualiza (progresso 100 = conquista) |
| GET | `/metas/conquistas` | Metas concluídas |
| GET | `/github/perfil` | Perfil do GitHub |
| GET | `/github/repos` | Repositórios |

## Deploy no Railway

1. Suba este código pro GitHub (repo novo, ex: `marciosys-backend`).
2. Em [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Adicione um **PostgreSQL**: New → Database → PostgreSQL. O Railway injeta `DATABASE_URL` automaticamente.
4. Em **Variables**, configure:
   - `SECRET_KEY` → gere com `openssl rand -hex 32`
   - `GITHUB_TOKEN` → opcional, evita rate limit (crie em github.com/settings/tokens)
   - `FRONTEND_ORIGINS` → já vem com seu GitHub Pages configurado
5. O Railway detecta o `railway.toml` e sobe sozinho.
6. Copie a URL gerada (algo como `https://marciosys-backend.up.railway.app`) e cole no `frontend-exemplo.js`.

## Conectar ao front-end
Veja `frontend-exemplo.js` — tem todas as funções prontas pra colar no JS do MARCIO.SYS.

## Próximos passos sugeridos
- Adicionar testes com `pytest`
- Migrations com `alembic` (em vez de `create_all`)
- Refresh tokens
- Cache das respostas do GitHub
