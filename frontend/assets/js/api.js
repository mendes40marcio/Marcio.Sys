// Cliente da API MARCIO.SYS.
//
// Endereço da API:
//  - Painel servido pela própria API (padrão): mesmo endereço, nada a configurar.
//  - Painel hospedado em outro lugar (Netlify, GitHub Pages): preencha a
//    meta tag <meta name="api-base" content="https://sua-api.up.railway.app">
//    no index.html.

const meta = document.querySelector('meta[name="api-base"]');
export const API_BASE = (meta?.content || '').replace(/\/$/, '');
export const ABERTO_COMO_ARQUIVO = location.protocol === 'file:' && !API_BASE;

const CHAVE_SESSAO = 'msys:sessao';

function lerSessao() {
  try {
    const s = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || 'null');
    if (s && s.exp > Date.now()) return s;
  } catch { /* ignora */ }
  return null;
}

let sessao = lerSessao();

export const usuario = () => sessao?.user ?? null;
export const logado = () => Boolean(sessao && sessao.exp > Date.now());

function guardarSessao(s) {
  sessao = s;
  try {
    if (s) sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(s));
    else sessionStorage.removeItem(CHAVE_SESSAO);
  } catch { /* ignora */ }
}

export class ErroApi extends Error {
  constructor(msg, status) { super(msg); this.status = status; }
}

function mensagemDeErro(status, corpo) {
  const d = corpo?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d[0]?.msg) {
    const campo = d[0].loc?.at(-1);
    return campo ? `${campo}: ${d[0].msg}` : d[0].msg;
  }
  return `Erro ${status}`;
}

export async function apiCall(caminho, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (sessao) headers.Authorization = `Bearer ${sessao.token}`;
  let payload;
  if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(form);
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${caminho}`, { method, headers, body: payload });
  } catch {
    throw new ErroApi('A API não respondeu. Ela está rodando?', 0);
  }

  if (res.status === 401 && sessao) {
    // Token expirou ou ficou inválido: encerra a sessão e avisa o painel.
    guardarSessao(null);
    window.dispatchEvent(new CustomEvent('sessao-expirada'));
    throw new ErroApi('Sua sessão expirou. Entre de novo.', 401);
  }
  if (!res.ok) {
    let corpo = null;
    try { corpo = await res.json(); } catch { /* sem corpo */ }
    throw new ErroApi(mensagemDeErro(res.status, corpo), res.status);
  }
  return res.status === 204 ? null : res.json();
}

export async function entrar(username, password) {
  const dados = await apiCall('/auth/login', { method: 'POST', form: { username, password } });
  guardarSessao({
    token: dados.access_token,
    user: username,
    // margem de 1 min para não usar um token que expira no meio da requisição
    exp: Date.now() + (dados.expires_in - 60) * 1000,
  });
}

export const sair = () => guardarSessao(null);

export const api = {
  saude: () => apiCall('/health'),
  registrar: (username, password) => apiCall('/auth/register', { method: 'POST', body: { username, password } }),
  resumo: () => apiCall('/estudos/resumo'),
  estudos: () => apiCall('/estudos'),
  criarEstudo: (dados) => apiCall('/estudos', { method: 'POST', body: dados }),
  editarEstudo: (id, dados) => apiCall(`/estudos/${id}`, { method: 'PATCH', body: dados }),
  somarHoras: (id, horas) => apiCall(`/estudos/${id}/horas?horas=${encodeURIComponent(horas)}`, { method: 'PATCH' }),
  apagarEstudo: (id) => apiCall(`/estudos/${id}`, { method: 'DELETE' }),
  metas: () => apiCall('/metas'),
  criarMeta: (dados) => apiCall('/metas', { method: 'POST', body: dados }),
  editarMeta: (id, dados) => apiCall(`/metas/${id}`, { method: 'PATCH', body: dados }),
  apagarMeta: (id) => apiCall(`/metas/${id}`, { method: 'DELETE' }),
};
