// Estado local do painel (o que não está na API): horas complementares,
// percentuais manuais, status das disciplinas, checkpoints e pomodoro.
// Fica no localStorage deste navegador.

const CHAVE = 'msys:estado';
const VERSAO = 6;

const PADRAO = {
  versao: VERSAO,
  horasTotal: 226,     // horas complementares confirmadas no portal
  horasExigidas: 170,
  dioPct: 0,           // progresso no bootcamp DIO (manual)
  posPct: 10,          // progresso na pós-graduação (manual)
  disciplinas: {},     // { idDisciplina: true|false } sobrescreve o padrão (itens extras)
  graduacao: null,     // último resumo de /disciplinas/resumo (barra lateral e dashboard)
  checkpoints: {},     // { cpKey: [indices marcados] }
  pomodoro: { dia: '', sessoes: 0 },
};

function ler() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (salvo && salvo.versao === VERSAO) return { ...PADRAO, ...salvo };
  } catch { /* storage bloqueado ou JSON inválido: usa o padrão */ }
  return structuredClone(PADRAO);
}

export const estado = ler();

export function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch { /* modo privado: segue só em memória */ }
}

export function definir(campo, valor) {
  estado[campo] = valor;
  salvar();
}
