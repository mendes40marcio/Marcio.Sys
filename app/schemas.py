from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ---------- Auth ----------
class UserCreate(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Estudo ----------
class EstudoCreate(BaseModel):
    curso: str
    horas: float = 0.0
    plataforma: str = ""
    progresso: int = 0
    status: str = "ativo"
    tipo: str = "curso"


class EstudoOut(BaseModel):
    id: int
    curso: str
    horas: float
    plataforma: str
    data: datetime
    progresso: int
    status: str
    tipo: str

    class Config:
        from_attributes = True
        

class EstudoUpdate(BaseModel):
    curso: Optional[str] = None
    horas: Optional[float] = None
    plataforma: Optional[str] = None
    progresso: Optional[int] = None
    status: Optional[str] = None
    tipo: Optional[str] = None        


# ---------- Meta ----------
class MetaCreate(BaseModel):
    titulo: str
    descricao: str = ""
    progresso: int = 0


class MetaUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    progresso: Optional[int] = None
    concluida: Optional[bool] = None


class MetaOut(BaseModel):
    id: int
    titulo: str
    descricao: str
    concluida: bool
    progresso: int
    criada_em: datetime
    concluida_em: Optional[datetime]

    class Config:
        from_attributes = True
