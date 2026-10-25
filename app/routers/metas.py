from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.security import get_current_user

router = APIRouter(prefix="/metas", tags=["Metas e Conquistas"])


def _buscar(db: Session, meta_id: int, user: models.User) -> models.Meta:
    meta = (
        db.query(models.Meta)
        .filter(models.Meta.id == meta_id, models.Meta.user_id == user.id)
        .first()
    )
    if not meta:
        raise HTTPException(status_code=404, detail="Meta nao encontrada")
    return meta


@router.get("", response_model=List[schemas.MetaOut])
def listar(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Meta)
        .filter(models.Meta.user_id == user.id)
        .order_by(models.Meta.concluida, models.Meta.criada_em.desc())
        .all()
    )


@router.get("/conquistas", response_model=List[schemas.MetaOut])
def conquistas(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Meta)
        .filter(models.Meta.user_id == user.id, models.Meta.concluida.is_(True))
        .order_by(models.Meta.concluida_em.desc())
        .all()
    )


@router.post("", response_model=schemas.MetaOut, status_code=201)
def criar(
    dados: schemas.MetaCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    meta = models.Meta(**dados.model_dump(), user_id=user.id)
    _aplicar_conclusao(meta)
    db.add(meta)
    db.commit()
    db.refresh(meta)
    return meta


def _aplicar_conclusao(meta: models.Meta) -> None:
    """progresso 100 ou concluida=True => vira conquista com data."""
    if (meta.progresso or 0) >= 100:
        meta.concluida = True
    if meta.concluida:
        meta.progresso = 100
        if meta.concluida_em is None:
            meta.concluida_em = datetime.now(timezone.utc)
    else:
        meta.concluida_em = None


@router.patch("/{meta_id}", response_model=schemas.MetaOut)
def atualizar(
    meta_id: int,
    dados: schemas.MetaUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    meta = _buscar(db, meta_id, user)
    update_data = dados.model_dump(exclude_unset=True)
    # reabrir uma conquista: concluida=False sem progresso novo volta para 90%
    if update_data.get("concluida") is False and "progresso" not in update_data:
        update_data["progresso"] = min(meta.progresso, 90)
    for campo, valor in update_data.items():
        setattr(meta, campo, valor)
    _aplicar_conclusao(meta)
    db.commit()
    db.refresh(meta)
    return meta


@router.delete("/{meta_id}", status_code=204)
def deletar(
    meta_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    db.delete(_buscar(db, meta_id, user))
    db.commit()
    return Response(status_code=204)
