from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# Tipos de estudo. "complementar" separa horas complementares da faculdade
# dos cursos, para nao inflar a contagem de cursos no painel.
TipoEstudo = Literal["curso", "complementar", "faculdade", "livro"]
StatusEstudo = Literal["ativo", "concluido", "pausado"]


def _limpa(texto: str) -> str:
    texto = " ".join(texto.split())
    if not texto:
        raise ValueError("nao pode ficar vazio")
    return texto


# ---------- Auth ----------
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str = Field(min_length=8, max_length=72)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos


# ---------- Estudo ----------
class EstudoCreate(BaseModel):
    curso: str = Field(max_length=120)
    horas: float = Field(default=0.0, ge=0, le=10_000)
    plataforma: str = Field(default="", max_length=60)
    progresso: int = Field(default=0, ge=0, le=100)
    status: StatusEstudo = "ativo"
    tipo: TipoEstudo = "curso"

    _curso = field_validator("curso")(_limpa)

    @field_validator("plataforma")
    @classmethod
    def _plataforma(cls, v: str) -> str:
        return " ".join(v.split())


class EstudoUpdate(BaseModel):
    curso: Optional[str] = Field(default=None, max_length=120)
    horas: Optional[float] = Field(default=None, ge=0, le=10_000)
    plataforma: Optional[str] = Field(default=None, max_length=60)
    progresso: Optional[int] = Field(default=None, ge=0, le=100)
    status: Optional[StatusEstudo] = None
    tipo: Optional[TipoEstudo] = None

    @field_validator("curso")
    @classmethod
    def _curso(cls, v: Optional[str]) -> Optional[str]:
        return None if v is None else _limpa(v)


class EstudoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    curso: str
    horas: float
    plataforma: str
    data: datetime
    progresso: int
    status: str
    tipo: str


class Resumo(BaseModel):
    total_horas: float
    horas_cursos: float
    horas_complementares: float
    cursos: int
    concluidos: int
    por_curso: dict[str, float]
    por_plataforma: dict[str, float]
    por_tipo: dict[str, float]


# ---------- Meta ----------
class MetaCreate(BaseModel):
    titulo: str = Field(max_length=120)
    descricao: str = Field(default="", max_length=500)
    progresso: int = Field(default=0, ge=0, le=100)

    _titulo = field_validator("titulo")(_limpa)


class MetaUpdate(BaseModel):
    titulo: Optional[str] = Field(default=None, max_length=120)
    descricao: Optional[str] = Field(default=None, max_length=500)
    progresso: Optional[int] = Field(default=None, ge=0, le=100)
    concluida: Optional[bool] = None

    @field_validator("titulo")
    @classmethod
    def _titulo(cls, v: Optional[str]) -> Optional[str]:
        return None if v is None else _limpa(v)


class MetaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    descricao: str
    concluida: bool
    progresso: int
    criada_em: datetime
    concluida_em: Optional[datetime]


# ---------- Disciplina (graduacao) ----------
SituacaoDisciplina = Literal["a_iniciar", "cursando", "aprovado", "reprovado"]
SEMESTRE = r"^\d{4}\.[12]$"  # ex: 2026.1


def _confere(nota: Optional[float], situacao: Optional[str], inicio: Optional[date], fim: Optional[date]) -> None:
    if inicio and fim and fim < inicio:
        raise ValueError("o fim do periodo nao pode ser antes do inicio")
    if situacao in ("a_iniciar", "cursando") and nota is not None:
        raise ValueError("disciplina sem resultado ainda nao pode ter nota")
    if situacao in ("aprovado", "reprovado") and nota is None:
        raise ValueError("informe a nota de uma disciplina ja finalizada")


class DisciplinaCreate(BaseModel):
    nome: str = Field(max_length=120)
    codigo: str = Field(default="", max_length=40)
    semestre: str = Field(pattern=SEMESTRE)
    inicio: date
    fim: date
    nota: Optional[float] = Field(default=None, ge=0, le=10)
    situacao: SituacaoDisciplina = "a_iniciar"

    _nome = field_validator("nome")(_limpa)

    @model_validator(mode="after")
    def _regras(self):
        _confere(self.nota, self.situacao, self.inicio, self.fim)
        return self


class DisciplinaUpdate(BaseModel):
    nome: Optional[str] = Field(default=None, max_length=120)
    codigo: Optional[str] = Field(default=None, max_length=40)
    semestre: Optional[str] = Field(default=None, pattern=SEMESTRE)
    inicio: Optional[date] = None
    fim: Optional[date] = None
    nota: Optional[float] = Field(default=None, ge=0, le=10)
    situacao: Optional[SituacaoDisciplina] = None

    @field_validator("nome")
    @classmethod
    def _nome(cls, v: Optional[str]) -> Optional[str]:
        return None if v is None else _limpa(v)


class DisciplinaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    codigo: str
    semestre: str
    inicio: date
    fim: date
    nota: Optional[float]
    situacao: str


class ResumoGraduacao(BaseModel):
    total: int
    aprovadas: int
    reprovadas: int
    cursando: int
    a_iniciar: int
    media_geral: Optional[float]           # media das notas ja lancadas
    media_por_semestre: dict[str, float]
    em_andamento: list[str]                # nomes das disciplinas sendo cursadas
