// Pomodoro da barra lateral.
import { $, $$, notify } from './dom.js';
import { estado, salvar } from './store.js';

const MODOS = {
  foco: { min: 25, rotulo: 'Foco', cor: 'var(--pink)' },
  curta: { min: 5, rotulo: 'Pausa', cor: 'var(--teal)' },
  longa: { min: 15, rotulo: 'Pausa longa', cor: 'var(--gold)' },
};
const CIRC = 2 * Math.PI * 60;
const p2 = (n) => String(n).padStart(2, '0');

let modo = 'foco';
let total = MODOS.foco.min * 60;
let restante = total;
let rodando = false;
let fim = 0;       // horário previsto de término (evita atraso do setInterval em aba inativa)
let intervalo = null;

function sessoesHoje() {
  const hoje = new Date().toDateString();
  if (estado.pomodoro.dia !== hoje) {
    estado.pomodoro = { dia: hoje, sessoes: 0 };
    salvar();
  }
  return estado.pomodoro.sessoes;
}

function desenhar() {
  const txt = `${p2(Math.floor(restante / 60))}:${p2(restante % 60)}`;
  $('#rDigits').textContent = txt;
  $('#rFill').style.strokeDashoffset = CIRC * (1 - restante / total);
  document.title = rodando ? `${txt} · MARCIO.SYS` : 'MARCIO.SYS — Study OS';
}

function pontos() {
  const n = sessoesHoje();
  $$('.sdot').forEach((d, i) => d.classList.toggle('lit', i < n));
  $('#sdots').setAttribute('aria-label', `${n} de 4 sessões de foco hoje`);
}

function parar(rotuloBotao) {
  clearInterval(intervalo);
  rodando = false;
  $('#tBtn').textContent = rotuloBotao;
  $('#tBtn').setAttribute('aria-pressed', 'false');
}

function tick() {
  restante = Math.max(0, Math.round((fim - Date.now()) / 1000));
  desenhar();
  if (restante > 0) return;
  parar('Iniciar');
  restante = total;
  desenhar();
  if (modo === 'foco') {
    estado.pomodoro.sessoes = Math.min(sessoesHoje() + 1, 4);
    salvar();
    pontos();
    notify('Sessão concluída! Hora de descansar.', 'ok');
  } else {
    notify('Pausa encerrada. Bora focar!');
  }
}

export function alternar() {
  if (rodando) {
    parar('Retomar');
    return;
  }
  rodando = true;
  fim = Date.now() + restante * 1000;
  $('#tBtn').textContent = 'Pausar';
  $('#tBtn').setAttribute('aria-pressed', 'true');
  intervalo = setInterval(tick, 250);
}

export function reiniciar() {
  parar('Iniciar');
  restante = total;
  desenhar();
}

export function mudarModo(novo) {
  modo = novo;
  total = MODOS[novo].min * 60;
  reiniciar();
  $$('.mpill').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.arg === novo)));
  $('#rLbl').textContent = MODOS[novo].rotulo;
  $('#rFill').style.stroke = MODOS[novo].cor;
}

export function iniciarTimer() {
  $('#rFill').style.strokeDasharray = CIRC;
  mudarModo('foco');
  pontos();
}
