"""Carrega as disciplinas da graduacao (Engenharia de Software EAD) no banco.

Uso, na raiz do projeto e com o .venv ativo:
    python -m scripts.seed_disciplinas SEU_USUARIO

Pode rodar mais de uma vez: disciplinas que ja existem (mesmo nome e semestre)
sao atualizadas em vez de duplicadas.
"""
import sys
from datetime import date

from app import models
from app.database import Base, SessionLocal, engine

DISCIPLINAS = [
    # (nome, codigo, semestre, inicio, fim, nota, situacao)
    ("Interface e Jornada do Usuário", "CVCS_EAD_2206523", "2026.1", date(2026, 2, 1), date(2026, 2, 28), 9.5, "aprovado"),
    ("Engenharia de Prompt e Aplicações em IA", "CVCS_EAD_2206520", "2026.1", date(2026, 3, 1), date(2026, 3, 31), 9.5, "aprovado"),
    ("Prototipagem de Sistemas Computacionais", "CVCS_EAD_2206553", "2026.1", date(2026, 4, 1), date(2026, 4, 30), 9.5, "aprovado"),
    ("Programação de Computadores", "CVCS_EAD_2206551", "2026.1", date(2026, 5, 1), date(2026, 6, 30), 10.0, "aprovado"),
    ("Design Profissional", "CVCS_EAD_2308619", "2026.2", date(2026, 8, 1), date(2026, 8, 31), 10.0, "aprovado"),
    ("Temas Transversais", "CVCS_EAD_2322686", "2026.2", date(2026, 8, 1), date(2026, 12, 18), 9.0, "aprovado"),
    ("Desenvolvimento Front-End para Web", "CVCS_EAD_2309018", "2026.2", date(2026, 9, 1), date(2026, 9, 30), 10.0, "aprovado"),
    ("Algoritmos e Pensamento Computacional", "CVCS_EAD_2308772", "2026.2", date(2026, 10, 1), date(2026, 10, 31), None, "cursando"),
    ("Modelagem de Banco de Dados", "CVCS_EAD_2308992", "2026.2", date(2026, 11, 1), date(2026, 12, 18), None, "a_iniciar"),
]


def main(username: str) -> None:
    Base.metadata.create_all(bind=engine)  # garante que a tabela existe
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if user is None:
            sys.exit(f"Usuario '{username}' nao encontrado. Confira o nome usado no login.")

        criadas = atualizadas = 0
        for nome, codigo, semestre, inicio, fim, nota, situacao in DISCIPLINAS:
            existente = (
                db.query(models.Disciplina)
                .filter_by(user_id=user.id, nome=nome, semestre=semestre)
                .first()
            )
            campos = dict(codigo=codigo, inicio=inicio, fim=fim, nota=nota, situacao=situacao)
            if existente:
                for campo, valor in campos.items():
                    setattr(existente, campo, valor)
                atualizadas += 1
            else:
                db.add(models.Disciplina(nome=nome, semestre=semestre, user_id=user.id, **campos))
                criadas += 1
        db.commit()
        print(f"[MARCIO.SYS] Disciplinas: {criadas} criadas, {atualizadas} atualizadas.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Uso: python -m scripts.seed_disciplinas SEU_USUARIO")
    main(sys.argv[1])
