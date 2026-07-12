from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.security import get_current_user

router = APIRouter(prefix="/estudos", tags=["Estudos"])


@router.get("", response_model=List[schemas.EstudoOut])
def listar(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Estudo).filter(models.Estudo.user_id == user.id).all()


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
    horas: float,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    estudo = (
        db.query(models.Estudo)
        .filter(models.Estudo.id == estudo_id, models.Estudo.user_id == user.id)
        .first()
    )
    if not estudo:
        raise HTTPException(status_code=404, detail="Estudo nao encontrado")
    estudo.horas += horas
    db.commit()
    db.refresh(estudo)
    return estudo


@router.delete("/{estudo_id}", status_code=204)
def deletar(
    estudo_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    estudo = (
        db.query(models.Estudo)
        .filter(models.Estudo.id == estudo_id, models.Estudo.user_id == user.id)
        .first()
    )
    if not estudo:
        raise HTTPException(status_code=404, detail="Estudo nao encontrado")
    db.delete(estudo)
    db.commit()


@router.patch("/{estudo_id}", response_model=schemas.EstudoOut)
def atualizar(
    estudo_id: int,
    dados: schemas.EstudoUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    estudo = (
        db.query(models.Estudo)
        .filter(models.Estudo.id == estudo_id, models.Estudo.user_id == user.id)
        .first()
    )
    if not estudo:
        raise HTTPException(status_code=404, detail="Estudo nao encontrado")
    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(estudo, campo, valor)
    db.commit()
    db.refresh(estudo)
    return estudo


@router.get("/resumo")
def resumo(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    estudos = db.query(models.Estudo).filter(models.Estudo.user_id == user.id).all()
    total = sum(e.horas for e in estudos)
    por_curso = {}
    for e in estudos:
        por_curso[e.curso] = por_curso.get(e.curso, 0) + e.horas
    return {"total_horas": total, "cursos": len(estudos), "por_curso": por_curso}
