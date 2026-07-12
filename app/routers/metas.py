from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.security import get_current_user

router = APIRouter(prefix="/metas", tags=["Metas e Conquistas"])


@router.get("", response_model=List[schemas.MetaOut])
def listar(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Meta).filter(models.Meta.user_id == user.id).all()


@router.get("/conquistas", response_model=List[schemas.MetaOut])
def conquistas(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Meta)
        .filter(models.Meta.user_id == user.id, models.Meta.concluida == True)
        .all()
    )


@router.post("", response_model=schemas.MetaOut, status_code=201)
def criar(
    dados: schemas.MetaCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    meta = models.Meta(**dados.model_dump(), user_id=user.id)
    db.add(meta)
    db.commit()
    db.refresh(meta)
    return meta


@router.patch("/{meta_id}", response_model=schemas.MetaOut)
def atualizar(
    meta_id: int,
    dados: schemas.MetaUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    meta = (
        db.query(models.Meta)
        .filter(models.Meta.id == meta_id, models.Meta.user_id == user.id)
        .first()
    )
    if not meta:
        raise HTTPException(status_code=404, detail="Meta nao encontrada")

    update_data = dados.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(meta, campo, valor)

    # progresso 100 ou concluida=True => vira conquista com data
    if meta.progresso >= 100:
        meta.concluida = True
    if meta.concluida and meta.concluida_em is None:
        meta.concluida_em = datetime.utcnow()
        meta.progresso = 100
    if not meta.concluida:
        meta.concluida_em = None

    db.commit()
    db.refresh(meta)
    return meta


@router.delete("/{meta_id}", status_code=204)
def deletar(
    meta_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    meta = (
        db.query(models.Meta)
        .filter(models.Meta.id == meta_id, models.Meta.user_id == user.id)
        .first()
    )
    if not meta:
        raise HTTPException(status_code=404, detail="Meta nao encontrada")
    db.delete(meta)
    db.commit()
