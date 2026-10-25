// Papel de parede: o usuário escolhe uma imagem do computador.
// A imagem é reduzida (máx. 1920px) e salva no navegador, junto com os ajustes.
import { $, html, mount, notify } from './dom.js';

const CHAVE = 'msys:papel';
const PADRAO = { img: '', escurecer: 45, desfoque: 0, paineis: 90 };

function ler() {
  try { return { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE) || '{}') }; } catch { return { ...PADRAO }; }
}
let cfg = ler();

function guardar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(cfg));
    return true;
  } catch {
    return false; // sem espaço no armazenamento
  }
}

export function aplicarPapel() {
  const el = $('#wallpaper');
  const raiz = document.documentElement;
  const ativo = Boolean(cfg.img);
  document.body.classList.toggle('tem-papel', ativo);
  el.style.backgroundImage = ativo ? `url("${cfg.img}")` : '';
  raiz.style.setProperty('--papel-escuro', String(cfg.escurecer / 100));
  raiz.style.setProperty('--papel-blur', `${cfg.desfoque}px`);
  raiz.style.setProperty('--panel', `rgba(27, 10, 47, ${cfg.paineis / 100})`);
}

// Reduz a imagem para caber no armazenamento do navegador
async function reduzir(arquivo, larguraMax = 1920, qualidade = 0.85) {
  const bmp = await createImageBitmap(arquivo);
  const escala = Math.min(1, larguraMax / bmp.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * escala);
  canvas.height = Math.round(bmp.height * escala);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return canvas.toDataURL('image/jpeg', qualidade);
}

async function escolherArquivo(arquivo) {
  if (!arquivo) return;
  if (!arquivo.type.startsWith('image/')) { notify('Escolha um arquivo de imagem.', 'erro'); return; }
  const anterior = cfg.img;
  try {
    // tenta em boa qualidade; se não couber, reduz mais
    for (const [larg, q] of [[1920, 0.85], [1600, 0.75], [1280, 0.7]]) {
      cfg.img = await reduzir(arquivo, larg, q);
      if (guardar()) {
        aplicarPapel();
        desenharDialogo();
        notify('Papel de parede aplicado', 'ok');
        return;
      }
    }
    cfg.img = anterior;
    notify('Imagem grande demais para salvar no navegador.', 'erro');
  } catch {
    cfg.img = anterior;
    notify('Não consegui abrir essa imagem.', 'erro');
  }
}

const faixa = (nome, rotulo, min, max, sufixo) => html`
  <label class="field">
    <span>${rotulo}: <output id="out-${nome}">${cfg[nome]}${sufixo}</output></span>
    <input type="range" name="${nome}" min="${min}" max="${max}" value="${cfg[nome]}" data-sufixo="${sufixo}">
  </label>`;

function desenharDialogo() {
  const dlg = $('#dlgPapel');
  mount(dlg, html`
    <form method="dialog" class="dlg">
      <h2 class="dlg-title" id="papelTitle">Papel de parede</h2>
      <div class="papel-preview ${cfg.img ? '' : 'vazio'}" ${cfg.img ? html`style="background-image:url('${cfg.img}')"` : ''}>
        ${cfg.img ? '' : html`<span>Usando o pôr do sol padrão</span>`}
      </div>
      <label class="btn btn-primary file-btn">
        Escolher imagem do computador
        <input type="file" accept="image/*" name="arquivo" class="sr-only">
      </label>
      <div class="papel-ajustes">
        ${faixa('escurecer', 'Escurecer o fundo', 0, 85, '%')}
        ${faixa('desfoque', 'Desfoque', 0, 16, 'px')}
        ${faixa('paineis', 'Opacidade dos cards', 50, 98, '%')}
      </div>
      <p class="muted small">A imagem fica salva só neste navegador. Dica: imagens escuras deixam o texto mais legível.</p>
      <div class="dlg-actions">
        ${cfg.img ? html`<button type="button" class="btn btn-ghost danger" data-papel="remover">Voltar ao pôr do sol</button>` : ''}
        <button value="fechar" class="btn btn-ghost">Fechar</button>
      </div>
    </form>`);
}

export function abrirPapel() {
  const dlg = $('#dlgPapel');
  desenharDialogo();
  if (!dlg.dataset.ligado) {
    dlg.dataset.ligado = '1';
    dlg.addEventListener('change', (e) => {
      if (e.target.name === 'arquivo') escolherArquivo(e.target.files[0]);
      else if (e.target.type === 'range') guardar();
    });
    dlg.addEventListener('input', (e) => {
      const r = e.target;
      if (r.type !== 'range') return;
      cfg[r.name] = Number(r.value);
      $(`#out-${r.name}`, dlg).textContent = `${r.value}${r.dataset.sufixo}`;
      aplicarPapel();
    });
    dlg.addEventListener('click', (e) => {
      if (e.target.closest('[data-papel="remover"]')) {
        cfg.img = '';
        guardar();
        aplicarPapel();
        desenharDialogo();
        notify('Voltou ao pôr do sol');
      }
    });
  }
  dlg.showModal();
}
