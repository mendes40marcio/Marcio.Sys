// Telas com conteúdo fixo + estado local.
import { html, raw, mount, num } from '../dom.js';
import { estado } from '../store.js';
import { COURSERA, CERTIFICADOS, HORAS_ITENS, DISCIPLINAS, MODULOS, LINKS } from '../content.js';
import { api, logado } from '../api.js';

// ── Componentes ──
export const cabecalho = (tag, titulo, sub, extra = '') => html`
  <header class="view-head">
    <div>
      <p class="eyebrow">${tag}</p>
      <h1 class="view-title">${titulo}</h1>
      <p class="view-sub">${sub}</p>
    </div>
    ${extra}
  </header>`;

const link = (url, rotulo, cls = 'btn btn-ghost') =>
  html`<a class="${cls}" href="${url}" target="_blank" rel="noopener noreferrer">${rotulo} <span aria-hidden="true">↗</span></a>`;

// Número que vira campo de edição ao clicar (valor salvo no navegador)
export const editavel = (campo, sufixo, rotulo) => html`
  <button type="button" class="editavel" data-action="editar-num" data-campo="${campo}"
    data-sufixo="${sufixo}" aria-label="${rotulo}: ${estado[campo]}${sufixo}. Clique para editar">
    ${estado[campo]}<small>${sufixo}</small>
  </button>`;

const barra = (pct, cor = 'var(--sunset)') => html`
  <div class="bar" role="presentation"><div class="bar-fill" style="width:${Math.min(100, Math.max(0, pct))}%;background:${raw(cor)}"></div></div>`;

const statCard = ({ rotulo, valor, sub, pct = 100, cor = 'var(--sunset)', destaque = '' }) => html`
  <article class="card stat ${destaque}">
    <p class="stat-label">${rotulo}</p>
    <p class="stat-value">${valor}</p>
    <p class="stat-sub">${sub}</p>
    ${barra(pct, cor)}
  </article>`;

// ── Cálculos compartilhados ──
export function disciplinaConcluida(d) {
  return estado.disciplinas[d.id] ?? d.concluida;
}

export function progressoLateral() {
  const discsOk = DISCIPLINAS.filter(disciplinaConcluida).length;
  return [
    { rotulo: 'Coursera · 7/7', pct: 100 },
    { rotulo: 'Horas complementares', pct: Math.round((estado.horasTotal / estado.horasExigidas) * 100) },
    { rotulo: 'Disciplinas EAD', pct: Math.round((discsOk / DISCIPLINAS.length) * 100) },
    { rotulo: 'DIO Back-End', pct: estado.dioPct, campo: 'dioPct' },
    { rotulo: 'Pós-graduação EAD', pct: estado.posPct, campo: 'posPct' },
  ];
}

// ── Dashboard ──
export function renderDashboard(el) {
  const sobra = estado.horasTotal - estado.horasExigidas;
  const ativas = DISCIPLINAS.filter((d) => !disciplinaConcluida(d) && d.periodo !== 'Outros');

  mount(el, html`
    ${cabecalho('Visão geral', 'Central de Estudos', 'Engenharia de Software · Cruzeiro do Sul Virtual · trilha para AI Engineering e Indústria 4.0')}

    <section class="live-strip" id="liveStrip" aria-live="polite">
      ${logado() ? html`<p class="muted">Carregando seus números…</p>` : html`
        <p>Entre na aba <button type="button" class="linklike" data-action="ir" data-arg="api">Meus Estudos</button> para ver suas horas reais da API aqui.</p>`}
    </section>

    <section class="grid-stats" aria-label="Resumo">
      ${statCard({ rotulo: 'Certificados Google', valor: html`${CERTIFICADOS.length}<small>/2</small>`, sub: 'IT Automation + AI Essentials', cor: 'var(--gold)' })}
      ${statCard({ rotulo: 'Coursera · IT Automation', valor: '7/7', sub: 'Todos os cursos concluídos' })}
      <article class="card stat">
        <p class="stat-label">Horas complementares</p>
        <p class="stat-value">${editavel('horasTotal', 'h', 'Horas complementares cumpridas')}</p>
        <p class="stat-sub">de ${estado.horasExigidas}h exigidas · ${sobra >= 0 ? `+${sobra}h de sobra` : `faltam ${-sobra}h`}</p>
        ${barra((estado.horasTotal / estado.horasExigidas) * 100, 'var(--mint)')}
      </article>
      ${statCard({ rotulo: 'Disciplinas em andamento', valor: ativas.length, sub: ativas.map((d) => d.titulo.split(' ')[0]).join(' · ') || 'Nenhuma no momento', pct: 100 - (ativas.length / DISCIPLINAS.length) * 100, cor: 'var(--violet)' })}
    </section>

    <section class="grid-2">
      <article class="card">
        <h2 class="card-title">Certificados</h2>
        <ul class="list">
          ${CERTIFICADOS.map((c) => html`
            <li class="list-row">
              <span class="ico" aria-hidden="true">🏅</span>
              <div><strong>${c.nome}</strong><span class="muted">${c.detalhe} · emitido em ${c.emitido}</span></div>
            </li>`)}
        </ul>
        <div class="row-actions">${link(LINKS.coursera, 'Ver na Coursera')} ${link(LINKS.linkedin, 'LinkedIn')}</div>
      </article>
      <article class="card">
        <h2 class="card-title">Próximo passo</h2>
        <p class="lead">DIO Luizalabs — Python Back-End</p>
        <p class="muted">APIs · FastAPI · PostgreSQL · Docker</p>
        <p class="stat-sub">Progresso: ${editavel('dioPct', '%', 'Progresso no bootcamp DIO')}</p>
        ${barra(estado.dioPct, 'var(--teal)')}
        <div class="row-actions">
          <button type="button" class="btn btn-ghost" data-action="ir" data-arg="backend">Ver roteiro</button>
          ${link(LINKS.dio, 'Abrir DIO')}
        </div>
      </article>
    </section>
  `);

  if (logado()) carregarFaixaAoVivo();
}

async function carregarFaixaAoVivo() {
  const faixa = document.getElementById('liveStrip');
  try {
    const r = await api.resumo();
    if (!faixa.isConnected) return;
    mount(faixa, html`
      <div class="live-grid">
        <div><span class="live-num">${num(r.horas_cursos)}h</span><span class="muted">em cursos</span></div>
        <div><span class="live-num">${r.cursos}</span><span class="muted">cursos · ${r.concluidos} concluídos</span></div>
        <div><span class="live-num">${num(r.horas_complementares)}h</span><span class="muted">complementares na API</span></div>
        <span class="live-tag">● ao vivo</span>
      </div>`);
  } catch (e) {
    if (faixa.isConnected) mount(faixa, html`<p class="muted">Não deu para carregar os números ao vivo: ${e.message}</p>`);
  }
}

// ── Coursera ──
export function renderCoursera(el) {
  mount(el, html`
    ${cabecalho('Coursera · Google + CIEE', 'Google IT Automation with Python', 'Certificado profissional · 7 de 7 cursos concluídos', link(LINKS.coursera, 'Ver certificado', 'btn btn-primary'))}
    <ol class="course-list">
      ${COURSERA.map((c) => html`
        <li class="card course">
          <span class="course-num">${c.num}</span>
          <div class="course-info">
            <h2 class="course-title">${c.titulo}</h2>
            <p class="muted">${c.nota}</p>
            ${barra(100, 'var(--mint)')}
          </div>
          <span class="pill pill-ok">Concluído</span>
        </li>`)}
    </ol>
  `);
}

// ── Horas complementares ──
const STATUS_HORAS = { ok: ['Aprovado', 'pill-ok'], wait: ['Em análise', 'pill-wait'], no: ['Reprovado', 'pill-no'] };

export function renderHoras(el) {
  const { horasTotal: total, horasExigidas: exigido } = estado;
  const soma = (s) => HORAS_ITENS.filter((i) => i.status === s).reduce((a, b) => a + b.ch, 0);
  const pct = Math.min(100, (total / exigido) * 100);

  mount(el, html`
    ${cabecalho('Cruzeiro do Sul', 'Atividades Complementares', `${total}h de ${exigido}h exigidas`, link(LINKS.portalHoras, 'Abrir portal', 'btn btn-primary'))}

    <section class="card horas-head">
      <div class="horas-nums">
        <div><span class="big">${editavel('horasTotal', 'h', 'Horas cumpridas')}</span><span class="muted">cumpridas</span></div>
        <div><span class="big">${Math.max(0, total - exigido)}<small>h</small></span><span class="muted">excedente</span></div>
        <div><span class="big">${editavel('horasExigidas', 'h', 'Horas exigidas')}</span><span class="muted">exigidas</span></div>
      </div>
      ${barra(pct, 'var(--sunset)')}
      <div class="pills">
        <span class="pill pill-ok">${soma('ok')}h aprovadas</span>
        <span class="pill pill-wait">${soma('wait')}h em análise</span>
        <span class="pill pill-no">${soma('no')}h reprovadas</span>
      </div>
      <p class="muted small">O total vem do portal e é editável aqui; a tabela lista os envios mais recentes.</p>
    </section>

    <div class="table-wrap card">
      <table class="table table-stack">
        <caption class="sr-only">Envios de atividades complementares</caption>
        <thead><tr><th scope="col">Tipo</th><th scope="col">Atividade</th><th scope="col" class="r">Carga</th><th scope="col">Envio</th><th scope="col">Status</th></tr></thead>
        <tbody>
          ${HORAS_ITENS.map((it) => html`
            <tr>
              <td data-label="Tipo" class="muted">${it.tipo}</td>
              <td data-label="Atividade"><strong>${it.nome}</strong></td>
              <td data-label="Carga" class="r mono">${it.ch}h</td>
              <td data-label="Envio" class="mono muted">${it.data}</td>
              <td data-label="Status"><span class="pill ${STATUS_HORAS[it.status][1]}">${STATUS_HORAS[it.status][0]}</span></td>
            </tr>`)}
        </tbody>
      </table>
    </div>
  `);
}

// ── Disciplinas ──
export function renderDisciplinas(el) {
  mount(el, html`
    ${cabecalho('Cruzeiro do Sul Virtual', 'Disciplinas — Engenharia de Software', 'EAD · marque como concluída quando fechar a nota', link(LINKS.blackboard, 'Abrir Blackboard', 'btn btn-primary'))}
    <div class="grid-cards">
      ${DISCIPLINAS.map((d) => {
        const ok = disciplinaConcluida(d);
        return html`
          <article class="card disc ${ok ? 'is-done' : ''}">
            <p class="eyebrow">${d.periodo}</p>
            <h2 class="disc-title">${d.titulo}</h2>
            <p class="mono muted small">${d.codigo} · ${d.turma}</p>
            <div class="disc-foot">
              <span class="pill ${ok ? 'pill-ok' : 'pill-wait'}">${ok ? 'Concluída' : 'Em andamento'}${d.nota && ok ? ` · nota ${d.nota}` : ''}</span>
              <button type="button" class="btn btn-ghost btn-sm" data-action="disciplina" data-arg="${d.id}" aria-pressed="${ok}">
                ${ok ? 'Reabrir' : 'Marcar concluída'}
              </button>
            </div>
          </article>`;
      })}
    </div>
  `);
}

// ── Módulos de estudo ──
export function renderModulo(el, id) {
  const m = MODULOS[id];
  const marcados = estado.checkpoints[m.cpKey] || [];
  const pct = (marcados.length / m.checkpoints.length) * 100;

  mount(el, html`
    ${cabecalho(m.tag, m.titulo, m.desc, link(m.acao.url, m.acao.label, 'btn btn-primary'))}
    <div class="grid-study">
      <div class="stack">
        <article class="card">
          <h2 class="card-title">Tópicos do módulo</h2>
          <ul class="list">
            ${m.topicos.map(([ico, t, s]) => html`
              <li class="list-row"><span class="ico" aria-hidden="true">${ico}</span><div><strong>${t}</strong><span class="muted">${s}</span></div></li>`)}
          </ul>
        </article>
        <article class="card">
          <h2 class="card-title">Código de referência</h2>
          <pre class="code" tabindex="0"><code>${m.codigo}</code></pre>
        </article>
        <div class="tags">${m.tags.map((t) => html`<span class="tag">${t}</span>`)}</div>
        <p class="callout">${m.destaque}</p>
      </div>
      <div class="stack">
        <article class="card">
          <h2 class="card-title">Dicas práticas</h2>
          <ul class="tips">${m.dicas.map((d) => html`<li>${d}</li>`)}</ul>
        </article>
        <article class="card">
          <h2 class="card-title">Checkpoints <span class="count" id="cpCount">${marcados.length}/${m.checkpoints.length}</span></h2>
          <ul class="checks">
            ${m.checkpoints.map((c, i) => html`
              <li><label class="check">
                <input type="checkbox" data-action="checkpoint" data-key="${m.cpKey}" data-idx="${i}" ${marcados.includes(i) ? raw('checked') : ''}>
                <span>${c}</span>
              </label></li>`)}
          </ul>
          <div class="bar" id="cpBar"><div class="bar-fill" style="width:${pct}%;background:var(--mint)"></div></div>
        </article>
      </div>
    </div>
  `);
}
