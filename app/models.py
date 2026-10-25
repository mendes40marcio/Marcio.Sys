from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


def agora() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=agora)

    estudos = relationship("Estudo", back_populates="owner", cascade="all, delete-orphan")
    metas = relationship("Meta", back_populates="owner", cascade="all, delete-orphan")


class Estudo(Base):
    __tablename__ = "estudos"

    id = Column(Integer, primary_key=True, index=True)
    curso = Column(String, nullable=False)          # ex: "Python", "Java"
    horas = Column(Float, default=0.0)              # horas acumuladas
    plataforma = Column(String, default="")         # ex: "DIO", "Coursera"
    data = Column(DateTime, default=agora)
    progresso = Column(Integer, default=0)          # 0 a 100
    status = Column(String, default="ativo")        # ativo/concluido/pausado
    tipo = Column(String, default="curso")          # curso/livro/faculdade
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="estudos")


class Meta(Base):
    __tablename__ = "metas"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)       # ex: "Concluir Bootcamp Santander"
    descricao = Column(Text, default="")
    concluida = Column(Boolean, default=False)    # vira "conquista" quando True
    progresso = Column(Integer, default=0)        # 0 a 100
    criada_em = Column(DateTime, default=agora)
    concluida_em = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="metas")
