// Conteúdo fixo do painel (cursos, disciplinas, módulos de estudo).
// Para atualizar textos, edite este arquivo. Dados que mudam com o tempo
// (horas, metas, estudos) ficam na API.
import { raw } from './dom.js';

const CURSOR = 'https://www.coursera.org';
const BLACKBOARD = 'https://bb.cruzeirodosulvirtual.com.br/ultra/course';
const PORTAL_HORAS = 'https://novoportal.cruzeirodosul.edu.br/gfa/atividade-complementar';

export const LINKS = { coursera: CURSOR, blackboard: BLACKBOARD, portalHoras: PORTAL_HORAS, dio: 'https://www.dio.me', linkedin: 'https://www.linkedin.com' };

// ── Coursera: Google IT Automation with Python ──
export const COURSERA = [
  { num: 'C1', titulo: 'Crash Course on Python', nota: 'Concluído · certificado emitido' },
  { num: 'C2', titulo: 'Using Python to Interact with the Operating System', nota: 'Concluído · certificado emitido' },
  { num: 'C3', titulo: 'Introduction to Git and GitHub', nota: 'Concluído em 12/04/2026 · nota 89,37%' },
  { num: 'C4', titulo: 'Troubleshooting and Debugging Techniques', nota: 'Concluído · 100%' },
  { num: 'C5', titulo: 'Configuration Management and the Cloud', nota: 'Concluído · 100%' },
  { num: 'C6', titulo: 'Automating Real-World Tasks with Python', nota: 'Concluído · 100%' },
  { num: 'C7', titulo: 'Accelerate Your Job Search with AI', nota: 'Concluído · 100%' },
];

export const CERTIFICADOS = [
  { nome: 'Google IT Automation with Python', detalhe: '7 cursos · Coursera + CIEE', emitido: '29/04/2026' },
  { nome: 'Google AI Essentials', detalhe: '7 cursos · Vibe Coding · Gemini', emitido: '09/05/2026' },
];

// ── Atividades complementares (Cruzeiro do Sul) ──
// status: ok = aprovado · wait = em análise · no = reprovado
export const HORAS_ITENS = [
  { tipo: 'Certificado Profissional Google', nome: 'Google IT Automation with Python', ch: 30, data: '28/04/2026', status: 'wait' },
  { tipo: 'Cursos presenciais ou online', nome: 'Felicidade e Qualidade de Vida', ch: 40, data: '14/04/2026', status: 'ok' },
  { tipo: 'Disciplinas excedentes', nome: 'Nivelamento de Inteligência Artificial', ch: 40, data: '05/04/2026', status: 'ok' },
  { tipo: 'Cursos online', nome: 'Internacionalização do Ensino Superior EAD', ch: 4, data: '01/04/2026', status: 'ok' },
  { tipo: 'Palestras / Seminários', nome: 'Masterclass', ch: 2, data: '26/03/2026', status: 'ok' },
  { tipo: 'Cursos online', nome: 'Prompt Avançado em IA', ch: 4, data: '22/03/2026', status: 'no' },
  { tipo: 'Cursos online', nome: 'Simplifica Inteligência Artificial Express', ch: 8, data: '17/03/2026', status: 'no' },
];

// ── Disciplinas EAD ──
// O status pode ser alterado no próprio painel (fica salvo no navegador).
export const DISCIPLINAS = [
  { id: 'prog', periodo: 'Graduação EAD — Mai/Jun 2026', codigo: 'CVCS_EAD_2206551', titulo: 'Programação de Computadores', turma: 'Turma_001_NE', concluida: false },
  { id: 'proto', periodo: 'Graduação EAD — Abril 2026', codigo: 'CVCS_EAD_2206553', titulo: 'Prototipagem de Sistemas Computacionais', turma: 'Turma_001_NE', concluida: false },
  { id: 'prompt', periodo: 'Graduação EAD — Março 2026', codigo: 'CVCS_EAD_2206520', titulo: 'Engenharia de Prompt e Aplicações em IA', turma: 'Turma_002_NE', concluida: true, nota: '9,5' },
  { id: 'ux', periodo: 'Graduação EAD — Fevereiro 2026', codigo: 'CVCS_EAD_2206523', titulo: 'Interface e Jornada do Usuário', turma: 'Turma_002_NE', concluida: true },
  { id: 'felic', periodo: '1º Semestre 2026', codigo: 'DSE_80_FELICIDADE_20261', titulo: 'Felicidade e Qualidade de Vida', turma: 'Semestral', concluida: false },
  { id: 'aula', periodo: 'Outros', codigo: 'cert_0258', titulo: 'Certificado — Aula Inaugural 26/01/2026', turma: 'Certificado emitido', concluida: true },
];

// ── Módulos de estudo ──
// `codigo` e `dicas` são conteúdo fixo escrito por você, por isso usam raw().
export const MODULOS = {
  git: {
    tag: 'Course 3 · Concluído · 89,37%',
    titulo: 'Git & GitHub — Controle de Versão',
    desc: 'Versionamento, colaboração remota e fluxo profissional de desenvolvimento.',
    topicos: [
      ['📁', 'Fluxo de trabalho Git', 'init · add · commit · push · pull · clone · status · log'],
      ['🔀', 'Branches e merge', 'branch · checkout · merge · resolução de conflitos · fast-forward'],
      ['↩️', 'Desfazer e recuperar', 'revert · reset --soft/--hard · reflog · stash · diff · cherry-pick'],
      ['🐙', 'GitHub remoto', 'remote · fetch · pull requests · fork · issues · GitHub Actions'],
      ['📝', 'Boas práticas', 'commits semânticos · .gitignore · README · branches de feature'],
    ],
    codigo: raw(`<span class="c"># fluxo diário</span>
<span class="k">git</span> <span class="f">status</span>
<span class="k">git</span> <span class="f">add</span> .
<span class="k">git</span> <span class="f">commit</span> -m <span class="s">"feat: minha feature"</span>
<span class="k">git</span> <span class="f">push</span> origin main

<span class="c"># branches</span>
<span class="k">git</span> <span class="f">checkout</span> -b feature/nova-func
<span class="k">git</span> <span class="f">checkout</span> main
<span class="k">git</span> <span class="f">merge</span> feature/nova-func
<span class="k">git</span> <span class="f">branch</span> -d feature/nova-func

<span class="c"># desfazer o último commit</span>
<span class="k">git</span> <span class="f">revert</span> HEAD            <span class="c"># seguro, mantém histórico</span>
<span class="k">git</span> <span class="f">reset</span> --soft HEAD~1    <span class="c"># volta o commit, mantém arquivos</span>`),
    tags: ['Git', 'GitHub', 'Branches', 'Open source'],
    destaque: 'Concluído em 12/04/2026 com nota 89,37%.',
    dicas: [
      raw('Use <code>git log --oneline --graph --all</code> para ver todas as branches em forma de gráfico.'),
      raw('Commits semânticos: <code>feat:</code> <code>fix:</code> <code>docs:</code> <code>refactor:</code> <code>test:</code> (Conventional Commits).'),
      raw('Nunca versione <code>.env</code> nem credenciais. Configure o <code>.gitignore</code> antes do primeiro commit.'),
      raw('Use o GitHub Copilot como par de programação, não como muleta.'),
    ],
    checkpoints: ['Completar módulo de branches', 'Resolver conflito de merge na prática', 'Fazer o primeiro Pull Request real', 'Configurar chave SSH no GitHub', 'Criar repositório com GitHub Education'],
    cpKey: 'cpg3',
    acao: { label: 'Abrir Coursera', url: CURSOR },
  },
  debug: {
    tag: 'Course 4 · Concluído',
    titulo: 'Troubleshooting & Debugging em Python',
    desc: 'Técnicas profissionais de debug, logging e resolução de problemas em scripts Python.',
    topicos: [
      ['🔍', 'Debug interativo', 'pdb · breakpoints · debugger do VS Code · print estratégico'],
      ['⚠️', 'Exceções em Python', 'SyntaxError · TypeError · ValueError · AttributeError · exceções próprias'],
      ['📋', 'Logging profissional', 'logging · níveis DEBUG a CRITICAL · FileHandler · RotatingFileHandler'],
      ['⏱️', 'Profiling', 'cProfile · timeit · memory_profiler · achar gargalos reais'],
      ['🧪', 'Testes automatizados', 'unittest · pytest · fixtures · mocks · patch · TDD · cobertura'],
    ],
    codigo: raw(`<span class="k">import</span> logging
<span class="k">from</span> unittest.mock <span class="k">import</span> patch

logging.<span class="f">basicConfig</span>(
    level=logging.DEBUG,
    format=<span class="s">'%(asctime)s [%(levelname)s] %(name)s: %(message)s'</span>,
    handlers=[logging.<span class="f">FileHandler</span>(<span class="s">'app.log'</span>), logging.<span class="f">StreamHandler</span>()],
)
logger = logging.<span class="f">getLogger</span>(__name__)

<span class="f">@patch</span>(<span class="s">'modulo.api_externa'</span>)
<span class="k">def</span> <span class="f">test_sucesso</span>(mock_api):
    mock_api.return_value = {<span class="s">"status"</span>: <span class="s">"ok"</span>}
    <span class="k">assert</span> <span class="f">minha_funcao</span>() == <span class="s">"ok"</span>`),
    tags: ['Debug', 'Logging', 'pytest', 'TDD'],
    destaque: 'De quem escreve código para quem entende e conserta código.',
    dicas: [
      raw('<code>python -m pdb script.py</code> abre o debug interativo: <code>n</code> próximo, <code>s</code> entrar, <code>c</code> continuar.'),
      raw('<code>logging</code> é melhor que <code>print</code>: você controla o nível e desliga em produção com uma linha.'),
      raw('TDD: escreva o teste antes do código. Economiza horas de bug depois.'),
      raw('<code>pip install pytest</code> e rode <code>pytest -v</code>. É mais simples que unittest.'),
    ],
    checkpoints: ['Usar pdb em um script real', 'Criar logging com FileHandler', 'Escrever 5 testes unitários', 'Configurar pytest no VS Code', 'Chegar a 80% de cobertura de testes'],
    cpKey: 'cpd4',
    acao: { label: 'Abrir Coursera', url: CURSOR },
  },
  ia: {
    tag: 'Faculdade · Concluída · Nota 9,5',
    titulo: 'Engenharia de Prompt e Aplicações em IA',
    desc: 'Arquitetura de agentes LLM, engenharia de prompt avançada, automação ética e projetos práticos.',
    topicos: [
      ['🧠', 'Arquitetura de agentes LLM', 'memória · ferramentas · planejamento · padrão ReAct'],
      ['✍️', 'Engenharia de prompt avançada', 'zero-shot · few-shot · chain-of-thought · tree-of-thought · RAG'],
      ['⚖️', 'IA ética e LGPD', 'viés algorítmico · justiça · transparência · LGPD art. 11 · auditoria'],
      ['📋', 'exp4 — Triagem ética de currículos', 'agente de recrutamento com critérios auditáveis e sem discriminação'],
      ['🔄', 'exp3 — Triagem de leads', 'qualificação automática de leads com validação humana no loop'],
    ],
    codigo: raw(`<span class="c"># exp4 — agente de triagem ética</span>
system_prompt = <span class="s">"""
Você é um agente de triagem de currículos.

CRITÉRIOS PERMITIDOS (LGPD):
  ✅ Habilidades técnicas comprovadas
  ✅ Experiência relevante para a vaga
  ✅ Portfólio e projetos demonstráveis

CRITÉRIOS PROIBIDOS (art. 11 LGPD):
  ❌ Gênero, idade, etnia, origem, foto
  ❌ Estado civil, religião, dados biométricos

Para CADA candidato, apresente:
1. Nota técnica (0-10) com justificativa
2. Recomendação: avançar / não avançar
3. Pontos de atenção objetivos
"""</span>`),
    tags: ['LLM', 'Prompt', 'Ética em IA', 'Agentes', 'LGPD'],
    destaque: 'Disciplina concluída com nota 9,5 · teoria e práticas 5/5.',
    dicas: [
      raw('Chain-of-thought funciona melhor pedindo para pensar passo a passo antes de responder.'),
      raw('System prompt bem estruturado gera comportamento consistente. Vale investir tempo nele.'),
      raw('RAG (Retrieval-Augmented Generation) é o padrão para agentes com base de conhecimento.'),
    ],
    checkpoints: ['Fundamentação teórica — 5/5', 'Experiências práticas — 5/5', 'exp3 — Triagem de leads entregue', 'exp4 — Triagem ética de currículos entregue', 'Disciplina concluída · nota 9,5'],
    cpKey: 'cpia',
    acao: { label: 'Abrir disciplina', url: BLACKBOARD },
  },
  backend: {
    tag: 'Bootcamp · DIO Luizalabs',
    titulo: 'Python Back-End — APIs, Banco e Deploy',
    desc: 'APIs REST, banco relacional, Docker e nuvem. O próprio MARCIO.SYS é o laboratório.',
    topicos: [
      ['🌐', 'APIs REST com FastAPI', 'rotas · CRUD · Pydantic v2 · JWT · middleware · OpenAPI'],
      ['🏗️', 'Django & DRF', 'models · views · serializers · admin · migrations'],
      ['🗄️', 'PostgreSQL + SQLAlchemy', 'ORM · Alembic · índices · transações'],
      ['🐳', 'Docker', 'Dockerfile · docker-compose · volumes · multi-stage builds'],
      ['☁️', 'Deploy e nuvem', 'Railway · Render · GitHub Actions CI/CD · variáveis de ambiente'],
    ],
    codigo: raw(`<span class="c"># trecho real da API MARCIO.SYS</span>
<span class="f">@router.patch</span>(<span class="s">"/{estudo_id}/horas"</span>)
<span class="k">def</span> <span class="f">adicionar_horas</span>(
    estudo_id: <span class="n">int</span>,
    horas: <span class="n">float</span> = <span class="f">Query</span>(gt=<span class="n">0</span>, le=<span class="n">24</span>),
    db: Session = <span class="f">Depends</span>(get_db),
    user: User = <span class="f">Depends</span>(get_current_user),
):
    estudo = <span class="f">_buscar</span>(db, estudo_id, user)
    estudo.horas += horas
    db.<span class="f">commit</span>()
    <span class="k">return</span> estudo`),
    tags: ['FastAPI', 'Django', 'PostgreSQL', 'Docker', 'CI/CD'],
    destaque: 'Meta: 2 APIs reais com autenticação no portfólio.',
    dicas: [
      raw('O FastAPI gera <code>/docs</code> (Swagger) sozinho. Mostre isso em entrevistas.'),
      raw('Docker desde o início: aparece em quase toda vaga de back-end.'),
      raw('PostgreSQL + SQLAlchemy é a dupla mais usada em projetos Python sérios.'),
      raw('GitHub Actions rodando os testes a cada push é um diferencial grande no portfólio.'),
    ],
    checkpoints: ['Criar a primeira API FastAPI com CRUD', 'Conectar PostgreSQL via SQLAlchemy', 'Implementar autenticação JWT', 'Dockerizar a aplicação', 'Fazer deploy no Railway ou Render', 'Escrever testes com pytest para a API'],
    cpKey: 'cpbe',
    acao: { label: 'Abrir DIO', url: 'https://www.dio.me' },
  },
};
