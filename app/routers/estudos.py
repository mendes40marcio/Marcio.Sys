from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.security import get_current_user

router = APIRouter(prefix="/estudos", tags=["Estudos"])


def _buscar(db: Session, estudo_id: int, user: models.User) -> models.Estudo:
    estudo = (
        db.query(models.Estudo)
        .filter(models.Estudo.id == estudo_id, models.Estudo.user_id == user.id)
        .first()
    )
    if not estudo:
        raise HTTPException(status_code=404, detail="Estudo nao encontrado")
    return estudo


@router.get("", response_model=List[schemas.EstudoOut])
def listar(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Estudo)
        .filter(models.Estudo.user_id == user.id)
        .order_by(models.Estudo.horas.desc(), models.Estudo.id)
        .all()
    )


@router.get("/resumo", response_model=schemas.Resumo)
def resumo(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    estudos = db.query(models.Estudo).filter(models.Estudo.user_id == user.id).all()

    por_curso: dict[str, float] = defaultdict(float)
    por_plataforma: dict[str, float] = defaultdict(float)
    por_tipo: dict[str, float] = defaultdict(float)
    for e in estudos:
        por_tipo[e.tipo] += e.horas
        if e.tipo == "complementar":
            continue  # horas complementares nao entram nos graficos de cursos
        por_curso[e.curso] += e.horas
        por_plataforma[e.plataforma or "Outros"] += e.horas

    cursos = [e for e in estudos if e.tipo != "complementar"]
    return {
        "total_horas": sum(e.horas for e in estudos),
        "horas_cursos": sum(e.horas for e in cursos),
        "horas_complementares": por_tipo.get("complementar", 0.0),
        "cursos": len(cursos),
        "concluidos": sum(1 for e in cursos if e.status == "concluido"),
        "por_curso": dict(por_curso),
        "por_plataforma": dict(por_plataforma),
        "por_tipo": dict(por_tipo),
    }


@router.post("", response_model=schemas.EstudoOut, status_code=201)
def criar(
    dados: schemas.EstudoCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    estudo = models.Estudo(**dados.model_dump(), user_id=user.id)
    db.add(estudo)
    db.commit()
    db.refresh(estudo)
    return estudo


@router.patch("/{estudo_id}/horas", response_model=schemas.EstudoOut)
def adicionar_horas(
    estudo_id: int,
    horas: float = Query(gt=0, le=24, description="Horas estudadas na sessao (max 24)"),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    estudo = _buscar(db, estudo_id, user)
    estudo.horas += horas
    db.commit()
    db.refresh(estudo)
    return estudo


@router.patch("/{estudo_id}", response_model=schemas.EstudoOut)
def atualizar(
    estudo_id: int,
    dados: schemas.EstudoUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    estudo = _buscar(db, estudo_id, user)
    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(estudo, campo, valor)
    db.commit()
    db.refresh(estudo)
    return estudo


@router.delete("/{estudo_id}", status_code=204)
def deletar(
    estudo_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    db.delete(_buscar(db, estudo_id, user))
    db.commit()
    return Response(status_code=204)
