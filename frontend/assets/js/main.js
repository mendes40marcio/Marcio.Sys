// Ponto de entrada do painel: navegação, relógio e eventos.
// Nenhum onclick no HTML: todo clique passa pelo listener abaixo, que lê
// data-action/data-form dos elementos.
import { $, $$, html, mount, notify } from './dom.js';
import { estado, salvar, definir } from './store.js';
import { MODULOS } from './content.js';
import { alternar, reiniciar, mudarModo, iniciarTimer } from './timer.js';
import { abrirPapel, aplicarPapel } from './wallpaper.js';
import {
  renderDashboard, renderCoursera, renderHoras, renderDisciplinas, renderModulo, progressoLateral,
} from './views/estaticas.js';
import { renderApi, acoesApi, formsApi, progressoMeta, sessaoExpirada } from './views/api-view.js';

const VIEWS = [
  { id: 'dash', icone: '◈', titulo: 'Dashboard', sub: 'Visão geral', render: renderDashboard },
  { id: 'api', icone: '🔌', titulo: 'Meus Estudos', sub: 'Ao vivo · API', badge: 'LIVE', render: renderApi },
  { id: 'coursera', icone: '🏆', titulo: 'Google IT Auto', sub: 'Coursera · 7/7', badge: 'OK', render: renderCoursera },
  { id: 'horas', icone: '📋', titulo: 'Horas Compl.', sub: () => `${estado.horasTotal}h / ${estado.horasExigidas}h`, render: renderHoras },
  { id: 'discs', icone: '🎓', titulo: 'Disciplinas', sub: 'Cruzeiro do Sul', render: renderDisciplinas },
  { id: 'git', icone: '🌿', titulo: 'Git & GitHub', sub: 'Course 3 · concluído', render: (el) => renderModulo(el, 'git') },
  { id: 'debug', icone: '🐛', titulo: 'Debugging', sub: 'Course 4 · concluído', render: (el) => renderModulo(el, 'debug') },
  { id: 'ia', icone: '🤖', titulo: 'Agentes de IA', sub: 'Faculdade · nota 9,5', render: (el) => renderModulo(el, 'ia') },
  { id: 'backend', icone: '🐍', titulo: 'Python Back-End', sub: 'DIO Luizalabs', render: (el) => renderModulo(el, 'backend') },
];

let atual = VIEWS[0].id;

// ── Navegação (com #hash, então F5 e o botão voltar funcionam) ──
function construirNav() {
  mount($('#sbNav'), html`${VIEWS.map((v) => html`
    <a class="nav-item" href="#/${v.id}" ${v.id === atual ? html`aria-current="page"` : ''}>
      <span class="ni-icon" aria-hidden="true">${v.icone}</span>
      <span class="ni-info"><span class="ni-title">${v.titulo}</span><span class="ni-sub">${typeof v.sub === 'function' ? v.sub() : v.sub}</span></span>
      ${v.badge ? html`<span class="ni-badge">${v.badge}</span>` : ''}
    </a>`)}`);
}

function construirProgresso() {
  mount($('#sidebarProgress'), html`${progressoLateral().map((it) => html`
    <div class="prog-item">
      <div class="prog-row"><span>${it.rotulo}</span>
        ${it.campo
          ? html`<button type="button" class="editavel sm" data-action="editar-num" data-campo="${it.campo}" data-sufixo="%" aria-label="${it.rotulo}: ${it.pct}%. Clique para editar">${it.pct}%</button>`
          : html`<span>${it.pct}%</span>`}
      </div>
      <div class="bar thin"><div class="bar-fill" style="width:${Math.min(100, it.pct)}%"></div></div>
    </div>`)}`);
}

function irPara(id, { foco = true } = {}) {
  const view = VIEWS.find((v) => v.id === id) || VIEWS[0];
  atual = view.id;
  construirNav();
  const content = $('#content');
  view.render(content);
  content.scrollTop = 0;
  if (foco) window.scrollTo({ top: 0 });
  if (foco) $('#content h1')?.focus({ preventScroll: true });
}

function rotaAtual() {
  return location.hash.replace(/^#\/?/, '') || 'dash';
}

window.addEventListener('hashchange', () => irPara(rotaAtual()));

function rerender() {
  construirProgresso();
  irPara(atual, { foco: false });
}

// ── Número editável (salvo no navegador) ──
function editarNumero(botao) {
  const campo = botao.dataset.campo;
  const sufixo = botao.dataset.sufixo || '';
  const form = document.createElement('form');
  form.className = 'edit-inline';
  mount(form, html`
    <label class="sr-only" for="ed-${campo}">Novo valor</label>
    <input id="ed-${campo}" type="number" min="0" ${sufixo === '%' ? html`max="100"` : html`max="10000"`} step="1" value="${estado[campo]}">
    <button class="btn btn-primary btn-xs" aria-label="Salvar">✓</button>`);
  botao.replaceWith(form);
  const input = form.querySelector('input');
  input.focus();
  input.select();

  const fechar = (salvarValor) => {
    if (!form.isConnected) return;
    if (salvarValor) {
      let v = Number(input.value);
      if (!Number.isFinite(v) || v < 0) { notify('Valor inválido.', 'erro'); input.focus(); return; }
      if (sufixo === '%') v = Math.min(100, v);
      definir(campo, Math.round(v));
      notify('Salvo', 'ok');
    }
    rerender();
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); fechar(true); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(false); });
  form.addEventListener('focusout', (e) => { if (!form.contains(e.relatedTarget)) fechar(true); });
}

// ── Ações de clique ──
const ACOES = {
  ir: (b) => { location.hash = `#/${b.dataset.arg}`; },
  'editar-num': editarNumero,
  disciplina: (b) => {
    const atualOk = b.getAttribute('aria-pressed') === 'true';
    estado.disciplinas[b.dataset.arg] = !atualOk;
    salvar();
    notify(atualOk ? 'Disciplina reaberta' : 'Disciplina concluída! 🎓', 'ok');
    rerender();
  },
  'timer-alternar': alternar,
  'timer-reiniciar': reiniciar,
  'timer-modo': (b) => mudarModo(b.dataset.arg),
  'papel-parede': abrirPapel,
  'tela-cheia': () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()),
  ...acoesApi,
};

document.addEventListener('click', (e) => {
  const alvo = e.target.closest('[data-action]');
  if (!alvo || alvo.matches('input')) return;
  const acao = ACOES[alvo.dataset.action];
  if (acao) { e.preventDefault(); acao(alvo); }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  formsApi[form.dataset.form]?.(form, e.submitter?.value);
});

// Checkboxes de checkpoint e ranges de meta
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.action === 'checkpoint') {
    const key = el.dataset.key;
    const idx = Number(el.dataset.idx);
    const lista = new Set(estado.checkpoints[key] || []);
    el.checked ? lista.add(idx) : lista.delete(idx);
    estado.checkpoints[key] = [...lista];
    salvar();
    const mod = Object.values(MODULOS).find((m) => m.cpKey === key);
    $('#cpCount').textContent = `${lista.size}/${mod.checkpoints.length}`;
    $('#cpBar .bar-fill').style.width = `${(lista.size / mod.checkpoints.length) * 100}%`;
    if (lista.size === mod.checkpoints.length) notify('🏆 Módulo completo!', 'ok');
  }
  if (el.dataset.action === 'meta-progresso') progressoMeta(el, true);
});
document.addEventListener('input', (e) => {
  if (e.target.dataset.action === 'meta-progresso') progressoMeta(e.target, false);
});

window.addEventListener('sessao-expirada', () => {
  notify('Sua sessão expirou. Entre de novo.', 'erro');
  sessaoExpirada();
});

// ── Relógio ──
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const p2 = (n) => String(n).padStart(2, '0');
function relogio() {
  const n = new Date();
  $('#tbTime').textContent = `${p2(n.getHours())}:${p2(n.getMinutes())}`;
  $('#tbDate').textContent = `${DIAS[n.getDay()]} ${n.getDate()} ${MESES[n.getMonth()]}`;
}

// ── Início ──
aplicarPapel();
relogio();
setInterval(relogio, 15_000);
iniciarTimer();
construirProgresso();
irPara(rotaAtual(), { foco: false });
$$('[data-js-only]').forEach((el) => el.removeAttribute('hidden'));
