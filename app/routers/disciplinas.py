from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.security import get_current_user

router = APIRouter(prefix="/disciplinas", tags=["Graduacao"])


def _buscar(db: Session, disciplina_id: int, user: models.User) -> models.Disciplina:
    disciplina = (
        db.query(models.Disciplina)
        .filter(models.Disciplina.id == disciplina_id, models.Disciplina.user_id == user.id)
        .first()
    )
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina nao encontrada")
    return disciplina


@router.get("", response_model=List[schemas.DisciplinaOut])
def listar(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    # Ordem cronologica: do primeiro periodo ao mais recente
    return (
        db.query(models.Disciplina)
        .filter(models.Disciplina.user_id == user.id)
        .order_by(models.Disciplina.inicio, models.Disciplina.id)
        .all()
    )


@router.get("/resumo", response_model=schemas.ResumoGraduacao)
def resumo(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    disciplinas = db.query(models.Disciplina).filter(models.Disciplina.user_id == user.id).all()

    contagem: dict[str, int] = defaultdict(int)
    notas_por_semestre: dict[str, list[float]] = defaultdict(list)
    for d in disciplinas:
        contagem[d.situacao] += 1
        if d.nota is not None:
            notas_por_semestre[d.semestre].append(d.nota)

    notas = [n for lista in notas_por_semestre.values() for n in lista]
    return {
        "total": len(disciplinas),
        "aprovadas": contagem["aprovado"],
        "reprovadas": contagem["reprovado"],
        "cursando": contagem["cursando"],
        "a_iniciar": contagem["a_iniciar"],
        "media_geral": round(sum(notas) / len(notas), 2) if notas else None,
        "media_por_semestre": {
            sem: round(sum(lista) / len(lista), 2) for sem, lista in sorted(notas_por_semestre.items())
        },
        "em_andamento": [d.nome for d in disciplinas if d.situacao == "cursando"],
    }


@router.post("", response_model=schemas.DisciplinaOut, status_code=201)
def criar(
    dados: schemas.DisciplinaCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    disciplina = models.Disciplina(**dados.model_dump(), user_id=user.id)
    db.add(disciplina)
    db.commit()
    db.refresh(disciplina)
    return disciplina


@router.patch("/{disciplina_id}", response_model=schemas.DisciplinaOut)
def atualizar(
    disciplina_id: int,
    dados: schemas.DisciplinaUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    disciplina = _buscar(db, disciplina_id, user)
    mudancas = dados.model_dump(exclude_unset=True)

    # Ao finalizar ou reabrir uma disciplina, a nota acompanha a situacao.
    # Ex: {"situacao": "aprovado", "nota": 9.5} ou {"situacao": "cursando"} (limpa a nota).
    if mudancas.get("situacao") in ("a_iniciar", "cursando") and "nota" not in mudancas:
        mudancas["nota"] = None

    # Confere as regras com o resultado final (o que mudou + o que ja estava salvo)
    final = {campo: mudancas.get(campo, getattr(disciplina, campo)) for campo in ("nota", "situacao", "inicio", "fim")}
    try:
        schemas._confere(final["nota"], final["situacao"], final["inicio"], final["fim"])
    except ValueError as erro:
        raise HTTPException(status_code=422, detail=str(erro))

    for campo, valor in mudancas.items():
        if valor is None and campo != "nota":
            continue  # so a nota pode ser apagada
        setattr(disciplina, campo, valor)
    db.commit()
    db.refresh(disciplina)
    return disciplina


@router.delete("/{disciplina_id}", status_code=204)
def deletar(
    disciplina_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    db.delete(_buscar(db, disciplina_id, user))
    db.commit()
    return Response(status_code=204)
