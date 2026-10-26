// Tela "Disciplinas": graduação vinda da API (/disciplinas) + itens extras fixos.
import { html, mount, notify, confirmar, num, $ } from '../dom.js';
import { api, logado } from '../api.js';
import { definir } from '../store.js';
import { EXTRAS_GRADUACAO, LINKS } from '../content.js';
import { cabecalho, link, disciplinaConcluida } from './estaticas.js';

const SITUACAO = {
  aprovado: ['Aprovado', 'pill-ok'],
  reprovado: ['Reprovado', 'pill-no'],
  cursando: ['Cursando', 'pill-wait'],
  a_iniciar: ['A iniciar', ''],
};
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

let dados = { lista: [], resumo: null };
let lancando = null; // id da disciplina com o formulário de nota aberto
let raiz = null;

// "2026-08-01" -> [2026, 8, 1], sem passar por Date (evita erro de fuso horário)
const partes = (iso) => iso.split('-').map(Number);

function periodo(d) {
  const [a1, m1] = partes(d.inicio);
  const [a2, m2] = partes(d.fim);
  if (a1 === a2 && m1 === m2) return `${MESES[m1 - 1]} ${a1}`;
  if (a1 === a2) return `${MES_CURTO[m1 - 1]}–${MES_CURTO[m2 - 1]} ${a1}`;
  return `${MES_CURTO[m1 - 1]}/${a1} – ${MES_CURTO[m2 - 1]}/${a2}`;
}

const nomeSemestre = (s) => {
  const [ano, n] = s.split('.');
  return `${n}º semestre ${ano}`;
};

const titulo = (texto) => html`<h2 class="card-title" style="margin:28px 0 12px">${texto}</h2>`;

export function renderDisciplinas(el) {
  raiz = el;
  lancando = null;
  mount(el, html`
    ${cabecalho('Cruzeiro do Sul Virtual', 'Disciplinas — Engenharia de Software', 'EAD · notas e situação salvas na API', link(LINKS.blackboard, 'Abrir Blackboard', 'btn btn-primary'))}
    <div id="discBody">${logado() ? html`<p class="muted">Carregando disciplinas…</p>` : convite()}</div>
    ${extras()}
  `);
  if (logado()) carregar();
}

const convite = () => html`
  <article class="card help">
    <h2 class="card-title">Entre para ver suas notas</h2>
    <p class="muted">As disciplinas e notas ficam no banco da API. Faça login na aba Meus Estudos e volte aqui.</p>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-action="ir" data-arg="api">Ir para Meus Estudos</button>
    </div>
  </article>`;

async function carregar() {
  try {
    const [lista, resumo] = await Promise.all([api.disciplinas(), api.resumoGraduacao()]);
    dados = { lista, resumo };
    definir('graduacao', resumo);
    window.dispatchEvent(new CustomEvent('graduacao-atualizada'));
    desenhar();
  } catch (e) {
    if (e.status === 401) return; // tratado pelo evento sessao-expirada
    const body = $('#discBody');
    if (body) {
      mount(body, html`<p class="form-msg">Erro ao carregar as disciplinas: ${e.message}</p>
        <button type="button" class="btn btn-ghost" data-action="disc-recarregar">Tentar de novo</button>`);
    }
  }
}

function desenhar() {
  const body = $('#discBody');
  if (!body) return;
  const { lista, resumo: r } = dados;
  const semestres = [...new Set(lista.map((d) => d.semestre))].sort().reverse(); // mais recente primeiro
  const mediasSem = Object.entries(r.media_por_semestre).map(([s, m]) => `${s}: ${num(m, 2)}`).join(' · ');

  mount(body, html`
    <section class="grid-stats" aria-label="Resumo da graduação">
      <article class="card stat">
        <p class="stat-label">Média geral</p>
        <p class="stat-value">${r.media_geral == null ? '—' : num(r.media_geral, 2)}</p>
        <p class="stat-sub">${mediasSem || 'nenhuma nota lançada'}</p>
      </article>
      <article class="card stat">
        <p class="stat-label">Aprovadas</p>
        <p class="stat-value">${r.aprovadas}<small>/${r.total}</small></p>
        <p class="stat-sub">${r.reprovadas ? `${r.reprovadas} reprovada(s)` : 'nenhuma reprovação'}</p>
      </article>
      <article class="card stat">
        <p class="stat-label">Cursando</p>
        <p class="stat-value">${r.cursando}</p>
        <p class="stat-sub">${r.em_andamento.join(' · ') || 'nenhuma no momento'}</p>
      </article>
      <article class="card stat">
        <p class="stat-label">A iniciar</p>
        <p class="stat-value">${r.a_iniciar}</p>
        <p class="stat-sub">próximas do calendário</p>
      </article>
    </section>

    ${semestres.map((s) => html`
      ${titulo(nomeSemestre(s))}
      <div class="grid-cards">${lista.filter((d) => d.semestre === s).reverse().map(cartao)}</div>`)}

    ${lista.length ? '' : html`<p class="muted">Nenhuma disciplina cadastrada ainda. Rode o script de carga ou use o Swagger.</p>`}
  `);
}

function cartao(d) {
  const [rotulo, cls] = SITUACAO[d.situacao] || [d.situacao, ''];
  return html`
    <article class="card disc ${d.situacao === 'aprovado' ? 'is-done' : ''}">
      <p class="eyebrow">${periodo(d)}</p>
      <h3 class="disc-title">${d.nome}</h3>
      <p class="mono muted small">${d.codigo || 'sem código'}</p>
      ${d.id === lancando ? formNota(d) : html`
        <div class="disc-foot">
          <span class="pill ${cls}">${rotulo}${d.nota != null ? ` · nota ${num(d.nota)}` : ''}</span>
          ${botao(d)}
        </div>`}
    </article>`;
}

function botao(d) {
  if (d.situacao === 'a_iniciar') {
    return html`<button type="button" class="btn btn-ghost btn-sm" data-action="disc-iniciar" data-id="${d.id}" aria-label="Começar ${d.nome}">Começar</button>`;
  }
  if (d.situacao === 'cursando') {
    return html`<button type="button" class="btn btn-primary btn-sm" data-action="disc-lancar" data-id="${d.id}" aria-label="Lançar nota de ${d.nome}">Lançar nota</button>`;
  }
  return html`<button type="button" class="btn btn-ghost btn-sm" data-action="disc-reabrir" data-id="${d.id}" aria-label="Reabrir ${d.nome}">Reabrir</button>`;
}

const formNota = (d) => html`
  <form class="form-grid" data-form="disc-nota" data-id="${d.id}" novalidate>
    <label class="field w-sm"><span>Nota</span>
      <input name="nota" type="number" min="0" max="10" step="0.1" inputmode="decimal" required></label>
    <label class="field"><span>Resultado</span>
      <select name="situacao"><option value="aprovado">Aprovado</option><option value="reprovado">Reprovado</option></select></label>
    <span class="row-actions">
      <button class="btn btn-primary btn-sm">Salvar</button>
      <button type="button" class="btn btn-ghost btn-sm" data-action="disc-cancelar">Cancelar</button>
    </span>
  </form>`;

// Itens que não estão no portal de notas (status salvo no navegador)
const extras = () => html`
  ${titulo('Outros')}
  <div class="grid-cards">
    ${EXTRAS_GRADUACAO.map((d) => {
      const ok = disciplinaConcluida(d);
      return html`
        <article class="card disc ${ok ? 'is-done' : ''}">
          <p class="eyebrow">${d.periodo}</p>
          <h3 class="disc-title">${d.titulo}</h3>
          <p class="mono muted small">${d.codigo} · ${d.turma}</p>
          <div class="disc-foot">
            <span class="pill ${ok ? 'pill-ok' : 'pill-wait'}">${ok ? 'Concluída' : 'Em andamento'}</span>
            <button type="button" class="btn btn-ghost btn-sm" data-action="disciplina" data-arg="${d.id}" aria-pressed="${ok}">
              ${ok ? 'Reabrir' : 'Marcar concluída'}
            </button>
          </div>
        </article>`;
    })}
  </div>`;

// ── Ações (chamadas pelo main.js) ──
const exec = async (fn, okMsg) => {
  try {
    await fn();
    if (okMsg) notify(okMsg, 'ok');
    lancando = null;
    await carregar();
  } catch (e) {
    if (e.status !== 401) notify(e.message, 'erro');
  }
};

const achar = (id) => dados.lista.find((d) => d.id === id);

export const acoesDisc = {
  'disc-recarregar': () => renderDisciplinas(raiz),
  'disc-iniciar': (b) => exec(() => api.editarDisciplina(Number(b.dataset.id), { situacao: 'cursando' }), 'Bons estudos! 📚'),
  'disc-lancar': (b) => {
    lancando = Number(b.dataset.id);
    desenhar();
    $('[data-form="disc-nota"] [name=nota]')?.focus();
  },
  'disc-cancelar': () => { lancando = null; desenhar(); },
  'disc-reabrir': async (b) => {
    const d = achar(Number(b.dataset.id));
    if (d && await confirmar('Reabrir disciplina?', `"${d.nome}" volta para Cursando e a nota ${num(d.nota)} é apagada.`, 'Reabrir')) {
      exec(() => api.editarDisciplina(d.id, { situacao: 'cursando' }), 'Disciplina reaberta');
    }
  },
};

export const formsDisc = {
  'disc-nota': (f) => {
    const texto = String(f.nota.value).replace(',', '.');
    const nota = Number(texto);
    if (texto === '' || !Number.isFinite(nota) || nota < 0 || nota > 10) {
      notify('Informe uma nota entre 0 e 10.', 'erro');
      f.nota.focus();
      return;
    }
    const situacao = f.situacao.value;
    exec(() => api.editarDisciplina(Number(f.dataset.id), { situacao, nota }), situacao === 'aprovado' ? 'Aprovado! 🎓' : 'Nota lançada');
  },
};
