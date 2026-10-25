// Utilitários de DOM com escape automático.
//
// html`...` escapa TODO valor interpolado. Só passa direto o que vier
// embrulhado em raw(), usado apenas para conteúdo fixo do próprio código.
// Isso fecha a porta para XSS vindo de dados da API.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}

export const raw = (s) => new Raw(String(s));

function render(v) {
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  if (v === false || v === null || v === undefined) return '';
  return esc(v);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => { out += render(v) + strings[i + 1]; });
  return new Raw(out);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function mount(el, content) {
  el.innerHTML = render(content);
}

// ── Notificações (região aria-live) ──
let notifTimer;
export function notify(msg, tipo = '') {
  const n = $('#notif');
  n.textContent = msg;
  n.className = `notif show ${tipo}`;
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => { n.className = 'notif'; }, 4000);
}

// ── Diálogo de confirmação acessível (substitui confirm/prompt) ──
export function confirmar(titulo, texto, rotuloOk = 'Confirmar') {
  return new Promise((resolve) => {
    const dlg = $('#dialog');
    mount(dlg, html`
      <form method="dialog" class="dlg">
        <h2 class="dlg-title" id="dlgTitle">${titulo}</h2>
        <p class="dlg-text">${texto}</p>
        <div class="dlg-actions">
          <button value="cancel" class="btn btn-ghost">Cancelar</button>
          <button value="ok" class="btn btn-danger" autofocus>${rotuloOk}</button>
        </div>
      </form>`);
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
    dlg.showModal();
  });
}

// Formata números no padrão brasileiro: 12.5 -> "12,5"
export const num = (n, casas = 1) =>
  Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: casas });
