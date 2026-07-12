// ============================================
// MARCIO.SYS - integracao com o back-end
// Cole/adapte no JS do seu dashboard
// ============================================

const API = "https://SEU-PROJETO.up.railway.app"; // troque pela URL do Railway

// ---- estado do token ----
let token = null; // guarde em memoria (NAO use localStorage em artifacts; num site real pode usar)

// ---- AUTH ----
async function registrar(username, password) {
  const r = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return r.json();
}

async function login(username, password) {
  // login usa form-urlencoded (padrao OAuth2)
  const body = new URLSearchParams({ username, password });
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await r.json();
  token = data.access_token;
  return token;
}

// helper para chamadas autenticadas
function auth() {
  return { Authorization: `Bearer ${token}` };
}

// ---- ESTUDOS ----
async function listarEstudos() {
  const r = await fetch(`${API}/estudos`, { headers: auth() });
  return r.json();
}

async function criarEstudo(curso, horas, plataforma) {
  const r = await fetch(`${API}/estudos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify({ curso, horas, plataforma }),
  });
  return r.json();
}

async function adicionarHoras(estudoId, horas) {
  const r = await fetch(`${API}/estudos/${estudoId}/horas?horas=${horas}`, {
    method: "PATCH",
    headers: auth(),
  });
  return r.json();
}

async function resumoEstudos() {
  const r = await fetch(`${API}/estudos/resumo`, { headers: auth() });
  return r.json(); // { total_horas, cursos, por_curso }
}

// ---- METAS / CONQUISTAS ----
async function criarMeta(titulo, descricao, progresso = 0) {
  const r = await fetch(`${API}/metas`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify({ titulo, descricao, progresso }),
  });
  return r.json();
}

async function concluirMeta(metaId) {
  const r = await fetch(`${API}/metas/${metaId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify({ concluida: true }),
  });
  return r.json();
}

async function listarConquistas() {
  const r = await fetch(`${API}/metas/conquistas`, { headers: auth() });
  return r.json();
}

// ---- GITHUB ----
async function githubRepos() {
  const r = await fetch(`${API}/github/repos`);
  return r.json();
}

// ---- exemplo de uso ----
async function exemplo() {
  await login("marcio", "minhasenha");
  await criarEstudo("Python", 10, "DIO");
  const resumo = await resumoEstudos();
  console.log("Total de horas estudadas:", resumo.total_horas);
}
