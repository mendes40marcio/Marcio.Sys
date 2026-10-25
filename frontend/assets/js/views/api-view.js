// Tela "Meus Estudos": dados reais da API (login, estudos, metas, gráficos).
import { html, mount, notify, confirmar, num, $ } from '../dom.js';
import { api, entrar, sair, logado, usuario, ABERTO_COMO_ARQUIVO, API_BASE } from '../api.js';
import { cabecalho } from './estaticas.js';

const TIPOS = { curso: 'Curso', complementar: 'Complementar', faculdade: 'Faculdade', livro: 'Livro' };
const STATUS = { ativo: 'Ativo', concluido: 'Concluído', pausado: 'Pausado' };

let dados = { resumo: null, estudos: [], metas: [] };
let editando = null;   // id do estudo em edição
let graficos = [];
let raiz = null;

export function renderApi(el) {
  raiz = el;
  editando = null;
  mount(el, html`
    ${cabecalho('Ao vivo · FastAPI', 'Meus Estudos', 'Dados salvos no banco da API MARCIO.SYS')}
    <p class="api-status" id="apiStatus" role="status">Verificando a conexão com a API…</p>
    <div id="apiBody"></div>
  `);
  verificar();
}

async function verificar() {
  const st = $('#apiStatus');
  if (ABERTO_COMO_ARQUIVO) {
    st.className = 'api-status off';
    st.textContent = 'O painel foi aberto como arquivo. Abra pelo endereço da API para os dados funcionarem.';
    mount($('#apiBody'), ajudaOffline());
    return;
  }
  try {
    const s = await api.saude();
    st.className = 'api-status on';
    mount(st, html`<span class="dot" aria-hidden="true"></span> Online — ${s.sistema} v${s.versao}`);
    logado() ? carregar() : telaLogin();
  } catch {
    st.className = 'api-status off';
    st.textContent = 'Offline — a API não respondeu.';
    mount($('#apiBody'), ajudaOffline());
  }
}

const ajudaOffline = () => html`
  <article class="card help">
    <h2 class="card-title">Como ligar a API</h2>
    <ol class="steps mono">
      <li>Abra o terminal na pasta do projeto</li>
      <li><code>source .venv/bin/activate</code></li>
      <li><code>uvicorn app.main:app --reload</code></li>
      <li>Acesse <code>http://127.0.0.1:8000</code></li>
    </ol>
    <button type="button" class="btn btn-ghost" data-action="api-recarregar">Tentar de novo</button>
  </article>`;

// ── Login ──
function telaLogin(msg = '') {
  mount($('#apiBody'), html`
    <form class="card auth" data-form="login" novalidate>
      <h2 class="card-title">Acesso</h2>
      <label class="field"><span>Usuário</span>
        <input name="username" autocomplete="username" required minlength="3" maxlength="40"></label>
      <label class="field"><span>Senha</span>
        <input name="password" type="password" autocomplete="current-password" required minlength="8" maxlength="72"></label>
      <div class="row-actions">
        <button class="btn btn-primary" value="entrar">Entrar</button>
        <button class="btn btn-ghost" value="criar">Criar conta</button>
      </div>
      <p class="form-msg" id="authMsg" role="alert">${msg}</p>
    </form>`);
  $('[name=username]').focus();
}

async function enviarLogin(form, botao) {
  const u = form.username.value.trim();
  const p = form.password.value;
  const msg = $('#authMsg');
  if (!u || !p) { msg.textContent = 'Preencha usuário e senha.'; return; }
  try {
    if (botao === 'criar') {
      await api.registrar(u, p);
      notify('Conta criada!', 'ok');
    }
    await entrar(u, p);
    notify(`Conectado como ${u}`, 'ok');
    carregar();
  } catch (e) {
    msg.textContent = e.message;
  }
}

// ── Painel ──
async function carregar() {
  const body = $('#apiBody');
  if (!body) return;
  if (!dados.resumo) mount(body, html`<p class="muted">Carregando dados…</p>`);
  try {
    const [resumo, estudos, metas] = await Promise.all([api.resumo(), api.estudos(), api.metas()]);
    dados = { resumo, estudos, metas };
    if ($('#apiBody')) desenhar();
  } catch (e) {
    if (e.status === 401) return; // tratado pelo evento sessao-expirada
    mount(body, html`<p class="form-msg">Erro ao carregar: ${e.message}</p>
      <button type="button" class="btn btn-ghost" data-action="api-recarregar">Tentar de novo</button>`);
  }
}

function desenhar() {
  const { resumo: r, estudos, metas } = dados;
  const conquistas = metas.filter((m) => m.concluida).length;

  mount($('#apiBody'), html`
    <div class="session-bar">
      <span>Logado como <strong>${usuario()}</strong></span>
      <span class="row-actions">
        <a class="btn btn-ghost btn-sm" href="${API_BASE}/docs" target="_blank" rel="noopener">Swagger ↗</a>
        <button type="button" class="btn btn-ghost btn-sm" data-action="api-sair">Sair</button>
      </span>
    </div>

    <section class="grid-stats" aria-label="Resumo da API">
      <article class="card stat"><p class="stat-label">Horas em cursos</p><p class="stat-value">${num(r.horas_cursos)}<small>h</small></p><p class="stat-sub">total geral ${num(r.total_horas)}h</p></article>
      <article class="card stat"><p class="stat-label">Cursos</p><p class="stat-value">${r.cursos}</p><p class="stat-sub">${r.concluidos} concluídos</p></article>
      <article class="card stat"><p class="stat-label">Complementares</p><p class="stat-value">${num(r.horas_complementares)}<small>h</small></p><p class="stat-sub">fora da contagem de cursos</p></article>
      <article class="card stat"><p class="stat-label">Conquistas</p><p class="stat-value">${conquistas}</p><p class="stat-sub">de ${metas.length} metas</p></article>
    </section>

    <section class="card">
      <h2 class="card-title">Novo estudo</h2>
      <form class="form-grid" data-form="novo-estudo" novalidate>
        <label class="field grow"><span>Curso</span><input name="curso" required maxlength="120" placeholder="ex.: Java Básico"></label>
        <label class="field w-sm"><span>Horas</span><input name="horas" type="number" min="0" max="10000" step="0.5" value="0"></label>
        <label class="field"><span>Plataforma</span><input name="plataforma" maxlength="60" placeholder="ex.: DIO" list="plataformas"></label>
        <label class="field"><span>Tipo</span>${selectTipo('tipo', 'curso')}</label>
        <button class="btn btn-primary">Adicionar</button>
      </form>
      <datalist id="plataformas">${[...new Set(estudos.map((e) => e.plataforma).filter(Boolean))].map((p) => html`<option value="${p}">`)}</datalist>
    </section>

    ${estudos.length ? html`
    <section class="grid-2">
      <article class="card"><h2 class="card-title">Horas por curso</h2><div class="chart-box"><canvas id="chCursos" role="img" aria-label="Gráfico de horas por curso"></canvas></div></article>
      <article class="card"><h2 class="card-title">Horas por plataforma</h2><div class="chart-box"><canvas id="chPlat" role="img" aria-label="Gráfico de horas por plataforma"></canvas></div></article>
    </section>` : ''}

    <section class="card">
      <h2 class="card-title">Estudos <span class="count">${estudos.length}</span></h2>
      ${estudos.length ? tabelaEstudos(estudos) : html`<p class="muted">Nenhum estudo ainda. Adicione o primeiro acima.</p>`}
    </section>

    <section class="card">
      <h2 class="card-title">Metas e conquistas</h2>
      <form class="form-grid" data-form="nova-meta" novalidate>
        <label class="field grow"><span>Nova meta</span><input name="titulo" required maxlength="120" placeholder="ex.: Certificação AWS Cloud Practitioner"></label>
        <label class="field grow"><span>Descrição (opcional)</span><input name="descricao" maxlength="500"></label>
        <button class="btn btn-primary">Criar meta</button>
      </form>
      ${metas.length ? html`<ul class="metas">${metas.map(itemMeta)}</ul>` : html`<p class="muted">Nenhuma meta ainda. Que tal a próxima certificação?</p>`}
    </section>
  `);
  desenharGraficos();
}

const selectTipo = (nome, atual) => html`
  <select name="${nome}">${Object.entries(TIPOS).map(([v, t]) => html`<option value="${v}" ${v === atual ? 'selected' : ''}>${t}</option>`)}</select>`;
const selectStatus = (atual) => html`
  <select name="status">${Object.entries(STATUS).map(([v, t]) => html`<option value="${v}" ${v === atual ? 'selected' : ''}>${t}</option>`)}</select>`;

function tabelaEstudos(estudos) {
  return html`
    <div class="table-wrap">
      <table class="table table-stack">
        <caption class="sr-only">Seus estudos</caption>
        <thead><tr><th scope="col">Curso</th><th scope="col">Tipo</th><th scope="col">Plataforma</th><th scope="col">Status</th><th scope="col" class="r">Horas</th><th scope="col" class="r">Ações</th></tr></thead>
        <tbody>${estudos.map((e) => (e.id === editando ? linhaEdicao(e) : linhaEstudo(e)))}</tbody>
      </table>
    </div>`;
}

const linhaEstudo = (e) => html`
  <tr>
    <td data-label="Curso"><strong>${e.curso}</strong></td>
    <td data-label="Tipo"><span class="tag tag-${e.tipo}">${TIPOS[e.tipo] || e.tipo}</span></td>
    <td data-label="Plataforma" class="muted">${e.plataforma || '—'}</td>
    <td data-label="Status">${STATUS[e.status] || e.status}</td>
    <td data-label="Horas" class="r mono">${num(e.horas)}h</td>
    <td class="r actions">
      <button type="button" class="btn btn-sm btn-ghost" data-action="estudo-horas" data-id="${e.id}" aria-label="Somar 1 hora em ${e.curso}">+1h</button>
      <button type="button" class="btn btn-sm btn-ghost" data-action="estudo-editar" data-id="${e.id}" aria-label="Editar ${e.curso}">Editar</button>
      <button type="button" class="btn btn-sm btn-ghost danger" data-action="estudo-apagar" data-id="${e.id}" aria-label="Excluir ${e.curso}">Excluir</button>
    </td>
  </tr>`;

const linhaEdicao = (e) => html`
  <tr class="editing">
    <td colspan="6">
      <form class="form-grid" data-form="editar-estudo" data-id="${e.id}" novalidate>
        <label class="field grow"><span>Curso</span><input name="curso" value="${e.curso}" required maxlength="120"></label>
        <label class="field"><span>Tipo</span>${selectTipo('tipo', e.tipo)}</label>
        <label class="field"><span>Plataforma</span><input name="plataforma" value="${e.plataforma}" maxlength="60" list="plataformas"></label>
        <label class="field"><span>Status</span>${selectStatus(e.status)}</label>
        <label class="field w-sm"><span>Horas</span><input name="horas" type="number" min="0" max="10000" step="0.5" value="${e.horas}"></label>
        <span class="row-actions">
          <button class="btn btn-primary btn-sm">Salvar</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="estudo-cancelar">Cancelar</button>
        </span>
      </form>
    </td>
  </tr>`;

const itemMeta = (m) => html`
  <li class="meta ${m.concluida ? 'is-done' : ''}">
    <div class="meta-info">
      <strong>${m.concluida ? '🏆 ' : ''}${m.titulo}</strong>
      ${m.descricao ? html`<span class="muted">${m.descricao}</span>` : ''}
      ${m.concluida
        ? html`<span class="muted small">Conquistada em ${new Date(m.concluida_em).toLocaleDateString('pt-BR')}</span>`
        : html`<label class="range"><span class="sr-only">Progresso de ${m.titulo}</span>
            <input type="range" min="0" max="100" step="10" value="${m.progresso}" data-action="meta-progresso" data-id="${m.id}">
            <output class="mono">${m.progresso}%</output></label>`}
    </div>
    <div class="actions">
      ${m.concluida
        ? html`<button type="button" class="btn btn-sm btn-ghost" data-action="meta-reabrir" data-id="${m.id}">Reabrir</button>`
        : html`<button type="button" class="btn btn-sm btn-primary" data-action="meta-concluir" data-id="${m.id}">Concluir</button>`}
      <button type="button" class="btn btn-sm btn-ghost danger" data-action="meta-apagar" data-id="${m.id}" aria-label="Excluir meta ${m.titulo}">Excluir</button>
    </div>
  </li>`;

// ── Gráficos (Chart.js) ──
function desenharGraficos() {
  graficos.forEach((g) => g.destroy());
  graficos = [];
  if (!window.Chart || !dados.estudos.length) return;

  const css = getComputedStyle(document.documentElement);
  const cor = (v) => css.getPropertyValue(v).trim();
  const txt = cor('--text-2');
  const grade = cor('--grid');
  const opcoes = (rotulo) => ({
    indexAxis: 'y',
    maintainAspectRatio: false,
    animation: matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 500 },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${num(c.parsed.x)}h ${rotulo}` } } },
    scales: {
      x: { ticks: { color: txt }, grid: { color: grade }, border: { display: false } },
      y: { ticks: { color: txt, autoSkip: false }, grid: { display: false }, border: { display: false } },
    },
  });
  const ordenar = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  const curto = (s) => (s.length > 26 ? `${s.slice(0, 25)}…` : s);

  const cursos = ordenar(dados.resumo.por_curso);
  const plats = ordenar(dados.resumo.por_plataforma);
  const desenhar = (id, pares, corBarra, rotulo) => {
    const canvas = document.getElementById(id);
    if (!canvas || !pares.length) return;
    canvas.parentElement.style.height = `${Math.max(140, pares.length * 34 + 40)}px`;
    graficos.push(new window.Chart(canvas, {
      type: 'bar',
      data: { labels: pares.map(([k]) => curto(k)), datasets: [{ data: pares.map(([, v]) => v), backgroundColor: corBarra, borderRadius: 4, barThickness: 18 }] },
      options: opcoes(rotulo),
    }));
  };
  desenhar('chCursos', cursos, cor('--pink'), 'estudadas');
  desenhar('chPlat', plats, cor('--teal'), 'nesta plataforma');
}

// ── Ações (chamadas pelo main.js) ──
const exec = async (fn, okMsg) => {
  try {
    await fn();
    if (okMsg) notify(okMsg, 'ok');
    await carregar();
  } catch (e) {
    if (e.status !== 401) notify(e.message, 'erro');
  }
};

const dadosEstudo = (f) => ({
  curso: f.curso.value.trim(),
  horas: Number(f.horas.value || 0),
  plataforma: f.plataforma.value.trim(),
  tipo: f.tipo.value,
  ...(f.status ? { status: f.status.value } : {}),
});

export const formsApi = {
  login: (f, botao) => enviarLogin(f, botao),
  'novo-estudo': (f) => {
    if (!f.curso.value.trim()) { notify('Informe o nome do curso.', 'erro'); f.curso.focus(); return; }
    exec(() => api.criarEstudo(dadosEstudo(f)), 'Estudo adicionado');
  },
  'editar-estudo': (f) => {
    if (!f.curso.value.trim()) { notify('O nome do curso não pode ficar vazio.', 'erro'); return; }
    editando = null;
    exec(() => api.editarEstudo(Number(f.dataset.id), dadosEstudo(f)), 'Estudo atualizado');
  },
  'nova-meta': (f) => {
    if (!f.titulo.value.trim()) { notify('Dê um título para a meta.', 'erro'); f.titulo.focus(); return; }
    exec(() => api.criarMeta({ titulo: f.titulo.value.trim(), descricao: f.descricao.value.trim() }), 'Meta criada');
  },
};

const acharEstudo = (id) => dados.estudos.find((e) => e.id === id);
const acharMeta = (id) => dados.metas.find((m) => m.id === id);

export const acoesApi = {
  'api-recarregar': () => renderApi(raiz),
  'api-sair': () => { sair(); dados = { resumo: null, estudos: [], metas: [] }; notify('Sessão encerrada'); telaLogin(); },
  'estudo-horas': (b) => exec(() => api.somarHoras(Number(b.dataset.id), 1), '+1h registrada'),
  'estudo-editar': (b) => { editando = Number(b.dataset.id); desenhar(); $('[data-form="editar-estudo"] [name=curso]')?.focus(); },
  'estudo-cancelar': () => { editando = null; desenhar(); },
  'estudo-apagar': async (b) => {
    const e = acharEstudo(Number(b.dataset.id));
    if (e && await confirmar('Excluir estudo?', `"${e.curso}" e suas ${num(e.horas)}h serão apagados. Não dá para desfazer.`, 'Excluir')) {
      exec(() => api.apagarEstudo(e.id), 'Estudo excluído');
    }
  },
  'meta-concluir': (b) => exec(() => api.editarMeta(Number(b.dataset.id), { concluida: true }), '🏆 Meta conquistada!'),
  'meta-reabrir': (b) => exec(() => api.editarMeta(Number(b.dataset.id), { concluida: false }), 'Meta reaberta'),
  'meta-apagar': async (b) => {
    const m = acharMeta(Number(b.dataset.id));
    if (m && await confirmar('Excluir meta?', `"${m.titulo}" será apagada.`, 'Excluir')) {
      exec(() => api.apagarMeta(m.id), 'Meta excluída');
    }
  },
};

// O range de progresso salva ao soltar (evento change) e atualiza o número ao arrastar (input)
export function progressoMeta(input, final) {
  input.nextElementSibling.textContent = `${input.value}%`;
  if (!final) return;
  const v = Number(input.value);
  exec(() => api.editarMeta(Number(input.dataset.id), { progresso: v }), v >= 100 ? '🏆 Meta conquistada!' : null);
}

export function sessaoExpirada() {
  dados = { resumo: null, estudos: [], metas: [] };
  if ($('#apiBody')) telaLogin('Sua sessão expirou. Entre de novo.');
}

