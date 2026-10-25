from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import models, schemas, security
from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Autenticacao"])


@router.post("/register", response_model=schemas.UserOut, status_code=201)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if not settings.ALLOW_REGISTER:
        raise HTTPException(status_code=403, detail="Cadastro desativado neste servidor")
    existe = db.query(models.User).filter(models.User.username == user.username).first()
    if existe:
        raise HTTPException(status_code=400, detail="Usuario ja existe")
    novo = models.User(
        username=user.username,
        hashed_password=security.hash_password(user.password),
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@router.post("/login", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form.username).first()
    if not user or not security.verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuario ou senha incorretos")
    token = security.create_access_token({"sub": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.get("/me", response_model=schemas.UserOut)
def me(current: models.User = Depends(security.get_current_user)):
    return current
