// ============================================================
// CASOS PRÉ-GERADOS — Criminal Investigation
// ============================================================
import type { InvestigationCase } from "../types/investigation";

// ────────────────────────────────────────────────────────────
// CASO 1 — "O ÚLTIMO JANTAR"
// Mansão aristocrática, época atual
// ────────────────────────────────────────────────────────────
export const CASE_ULTIMO_JANTAR: InvestigationCase = {
  id: "ultimo_jantar",
  title: "O Último Jantar",
  tagline: "Uma noite que ninguém deveria esquecer — mas alguém não vai poder contar.",
  setting: "mansion",
  settingDescription:
    "Mansão Vontade, litoral de São Paulo. A chuva não parou desde a chegada dos convidados. Todos os telefones foram recolhidos 'por pedido do anfitrião'. A única saída está trancada.",

  victim: {
    id: "alice",
    name: "Alice Vontade",
    avatar: "👩‍💼",
    profession: "Herdeira e CEO da Vontade Corp",
    backstory:
      "Alice era a filha mais velha do industrial Hélio Vontade. Assumiu a empresa após a morte misteriosa do pai há 3 anos. Todos os herdeiros discordavam de suas decisões.",
    secrets: [
      "Estava prestes a vender a empresa para um grupo estrangeiro",
      "Tinha provas de desvio de dinheiro por parte de seu sócio",
      "Mantinha um diário com segredos de todos os presentes",
    ],
  },

  killer: "carlos",
  motive:
    "Carlos desviou R$ 4 milhões da empresa. Alice descobriu e ia expô-lo no dia seguinte. Ele a envenenou no vinho antes do jantar.",

  suspects: [
    {
      id: "carlos",
      name: "Carlos Mendonça",
      avatar: "👨‍💼",
      profession: "Diretor Financeiro da Vontade Corp",
      alibi: "Estava na cozinha buscando vinho durante o momento do crime",
      motive: "Desvio financeiro prestes a ser revelado",
      isKiller: true,
      relationship: "business_partner",
      emotionByChapter: { 1: "calm", 2: "nervous", 3: "lying", 4: "angry", 5: "nervous" },
      truths: [
        "Sim, eu e Alice tínhamos divergências sobre a direção da empresa.",
        "Fui à cozinha por volta das 22h.",
      ],
      lies: [
        "Não sabia de nenhuma auditoria sendo preparada.",
        "Nunca tive acesso exclusivo ao vinho dela.",
      ],
      omissions: [
        "Sabia que Alice havia contratado uma auditoria externa três dias antes.",
        "Tinha a chave do armário de bebidas privativas de Alice.",
      ],
      revealedAt: 3,
      accusationCount: 0,
    },
    {
      id: "luciana",
      name: "Luciana Vontade",
      avatar: "👩‍🦱",
      profession: "Irmã mais nova / Bióloga",
      alibi: "Estava na varanda com Isabela durante o jantar",
      motive: "Querida herdar metade da empresa — Alice bloqueava isso",
      isKiller: false,
      relationship: "sibling",
      emotionByChapter: { 1: "calm", 2: "nervous", 3: "crying", 4: "cooperative", 5: "cooperative" },
      truths: [
        "Alice e eu nunca nos entendemos sobre o inventário do pai.",
        "Estava na varanda quando ouvimos o barulho.",
      ],
      lies: ["Não sabia que Carlos tinha problemas financeiros."],
      omissions: ["Ela sabia do diário de Alice e queria destruí-lo."],
      revealedAt: 4,
      accusationCount: 0,
    },
    {
      id: "isabela",
      name: "Isabela Ramos",
      avatar: "👩‍🔬",
      profession: "Ex-namorada / Farmacêutica",
      alibi: "Na varanda com Luciana",
      motive: "Alice terminou o relacionamento abruptamente após descobrir algo",
      isKiller: false,
      relationship: "lover",
      emotionByChapter: { 1: "calm", 2: "hiding", 3: "nervous", 4: "cooperative", 5: "cooperative" },
      truths: [
        "Sim, Alice e eu tivemos um relacionamento há dois anos.",
        "Trouxe medicamentos pessoais — sou farmacêutica.",
      ],
      lies: ["Não tenho motivo para prejudicar Alice."],
      omissions: [
        "O relacionamento terminou porque Alice descobriu que Isabela passava informações para Carlos.",
      ],
      revealedAt: 4,
      accusationCount: 0,
    },
    {
      id: "roberto",
      name: "Roberto Alcântara",
      avatar: "🧓",
      profession: "Advogado da família",
      alibi: "Na biblioteca revisando documentos",
      motive: "Perderá o contrato milionário se a empresa for vendida",
      isKiller: false,
      relationship: "business_partner",
      emotionByChapter: { 1: "calm", 2: "calm", 3: "hiding", 4: "nervous", 5: "cooperative" },
      truths: [
        "Estava revisei os contratos de venda na biblioteca até tarde.",
        "Alice me avisou sobre a venda semanas atrás.",
      ],
      lies: ["Apoiei completamente a decisão de Alice de vender."],
      omissions: ["Havia redigido um documento tentando impedir a venda legalmente."],
      revealedAt: 3,
      accusationCount: 0,
    },
  ],

  evidence: [
    {
      id: "ev_wine",
      title: "Taça de Vinho",
      description:
        "A taça usada por Alice contém resíduos de tetrodotoxina — veneno extraído de baiacu. Dose fatal. Introduzido no líquido, não no alimento.",
      category: "forensic",
      emoji: "🍷",
      pointsTo: "carlos",
      isFake: false,
      revealedInChapter: 1,
      linkedEvidenceIds: ["ev_key", "ev_lab"],
    },
    {
      id: "ev_key",
      title: "Chave do Armário de Vinhos",
      description:
        "Encontrada no bolso do paletó de Carlos. Dá acesso ao armário privativo de Alice, onde os vinhos especiais eram guardados.",
      category: "physical",
      emoji: "🔑",
      pointsTo: "carlos",
      isFake: false,
      revealedInChapter: 2,
      linkedEvidenceIds: ["ev_wine"],
    },
    {
      id: "ev_letter",
      title: "Carta Anônima",
      description:
        "Carta sem assinatura entregue à Alice na tarde do jantar: 'Você sabe o que Carlos fez. Mas eu sei o que você esconde.'",
      category: "document",
      emoji: "✉️",
      pointsTo: null,
      isFake: false,
      revealedInChapter: 1,
      linkedEvidenceIds: ["ev_audit"],
    },
    {
      id: "ev_audit",
      title: "Relatório de Auditoria",
      description:
        "Auditoria contratada por Alice três dias antes do jantar. Aponta desvio de R$ 4.132.000 ao longo de 18 meses. Nome do responsável: C. Mendonça.",
      category: "financial",
      emoji: "📊",
      pointsTo: "carlos",
      isFake: false,
      revealedInChapter: 2,
      linkedEvidenceIds: ["ev_letter", "ev_transfers"],
    },
    {
      id: "ev_transfers",
      title: "Transferências Bancárias",
      description:
        "Extrato de conta offshore no Panamá. Depósitos mensais de R$ 230.000 coincidindo com pagamentos da empresa. Titular: shell company ligada a C.M.",
      category: "financial",
      emoji: "💰",
      pointsTo: "carlos",
      isFake: false,
      revealedInChapter: 3,
      linkedEvidenceIds: ["ev_audit"],
    },
    {
      id: "ev_lab",
      title: "Frasco no Lixo da Cozinha",
      description:
        "Frasco de vidro pequeno, sem rótulo. Traços de tetrodotoxina. Impressão digital parcial na tampa.",
      category: "physical",
      emoji: "🧪",
      pointsTo: "carlos",
      isFake: false,
      revealedInChapter: 2,
      linkedEvidenceIds: ["ev_wine", "ev_glove"],
    },
    {
      id: "ev_glove",
      title: "Luva Descartável",
      description:
        "Luva látex encontrada atrás da geladeira da cozinha. DNA parcial. Possível proteção durante o manuseio do veneno.",
      category: "physical",
      emoji: "🧤",
      pointsTo: "carlos",
      isFake: false,
      revealedInChapter: 3,
      linkedEvidenceIds: ["ev_lab"],
    },
    {
      id: "ev_diary",
      title: "Diário de Alice",
      description:
        "Encontrado escondido no quarto. Última entrada: 'Carlos me pediu para não apresentar o relatório. Ele estava com medo nos olhos. Amanhã, tudo muda.'",
      category: "document",
      emoji: "📔",
      pointsTo: "carlos",
      isFake: false,
      revealedInChapter: 3,
      linkedEvidenceIds: ["ev_audit"],
    },
    {
      id: "ev_fake_note",
      title: "Bilhete 'Ameaça'",
      description:
        "Bilhete encontrado no quarto de Luciana: 'Saia da mansão hoje à noite'. Parece suspeito — mas Luciana mesma escreveu como lembrete de uma briga com Carlos.",
      category: "document",
      emoji: "📝",
      pointsTo: null,
      isFake: true,
      revealedInChapter: 2,
      linkedEvidenceIds: [],
    },
    {
      id: "ev_medication",
      title: "Bolsa Médica de Isabela",
      description:
        "Contém medicamentos comuns e uma seringa vazia. Isabela explica que toma injeção diária para condição autoimune. Laudo confirma.",
      category: "physical",
      emoji: "💊",
      pointsTo: null,
      isFake: true,
      revealedInChapter: 2,
      linkedEvidenceIds: [],
    },
  ],

  chapters: [
    {
      chapter: 1,
      title: "O Crime",
      openingNarration: [
        "A chuva batia nas janelas da Mansão Vontade quando o corpo foi encontrado.",
        "Alice Vontade, 34 anos, estava caída ao lado da mesa do jantar. A taça de vinho ainda em sua mão.",
        "Todos estavam presentes. Ninguém saiu. Alguém nessa sala é o assassino.",
      ],
      availableActions: [
        "Examinar a cena do crime",
        "Analisar a taça de vinho",
        "Ler a carta anônima",
        "Interrogar suspeitos inicialmente",
      ],
      newEvidenceIds: ["ev_wine", "ev_letter"],
      newEventIds: ["evt_body_found"],
      atmosphereNote: "Choque e tensão. Todos fingem cooperar.",
    },
    {
      chapter: 2,
      title: "A Investigação",
      openingNarration: [
        "Passada a primeira hora, as máscaras começam a cair.",
        "Novas evidências surgem. Algumas apontam para lugares inesperados.",
        "O médico legista confirma: envenenamento. Isso não foi um acidente.",
      ],
      availableActions: [
        "Examinar o armário de vinhos",
        "Revisar os quartos dos suspeitos",
        "Analisar o laudo do médico legista",
        "Segunda rodada de interrogatórios",
      ],
      newEvidenceIds: ["ev_key", "ev_lab", "ev_fake_note", "ev_medication", "ev_audit"],
      newEventIds: ["evt_key_found", "evt_alibi_check"],
      atmosphereNote: "Nervosismo crescente. Carlos evita contato visual.",
    },
    {
      chapter: 3,
      title: "Revelações",
      openingNarration: [
        "O advogado encontra o relatório de auditoria entre os pertences de Alice.",
        "R$ 4 milhões. Desviados. O nome aponta para uma direção.",
        "A cozinha guarda um segredo que quase ninguém notou.",
      ],
      availableActions: [
        "Confrontar Carlos sobre a auditoria",
        "Analisar o diário de Alice",
        "Rastrear as transferências bancárias",
        "Verificar a cozinha em detalhes",
      ],
      newEvidenceIds: ["ev_transfers", "ev_glove", "ev_diary"],
      newEventIds: ["evt_carlos_confronted", "evt_twist_isabela"],
      atmosphereNote: "A tensão atinge o pico. Alguém está prestes a quebrar.",
    },
    {
      chapter: 4,
      title: "O Interrogatório Final",
      openingNarration: [
        "É hora de parar de fazer perguntas e começar a apresentar fatos.",
        "As peças se encaixam. As mentiras estão expostas.",
        "Quem cometeu o crime e por quê — isso está escrito nas evidências.",
      ],
      availableActions: [
        "Confrontar o suspeito principal",
        "Apresentar linha do tempo",
        "Conectar evidências no quadro",
        "Preparar acusação final",
      ],
      newEvidenceIds: [],
      newEventIds: ["evt_final_confession_hint"],
      atmosphereNote: "Silêncio pesado. Todos sabem que está chegando ao fim.",
    },
    {
      chapter: 5,
      title: "O Julgamento",
      openingNarration: [
        "A investigação chegou ao fim.",
        "É hora de apresentar a teoria e votar no culpado.",
        "Errar significa que um assassino vai embora impune.",
      ],
      availableActions: ["Apresentar teoria", "Votar no culpado"],
      newEvidenceIds: [],
      newEventIds: [],
      atmosphereNote: "O destino da justiça está nas mãos dos investigadores.",
    },
  ],

  events: [
    {
      id: "evt_body_found",
      chapter: 1,
      type: "evidence_found",
      title: "Corpo Encontrado",
      narrative:
        "O mordomo grita do salão principal. Alice está no chão, os olhos abertos, sem pulso. A taça de vinho cristal ainda entre seus dedos.",
      unlocksEvidenceIds: ["ev_wine"],
    },
    {
      id: "evt_key_found",
      chapter: 2,
      type: "evidence_found",
      title: "A Chave Revelada",
      narrative:
        "Ao revistar os pertences dos presentes, a chave do armário privativo de Alice é encontrada no paletó de Carlos. Ele alega não saber como foi parar lá.",
      unlocksEvidenceIds: ["ev_key"],
      updatesSuspectEmotion: { suspectId: "carlos", emotion: "nervous" },
    },
    {
      id: "evt_alibi_check",
      chapter: 2,
      type: "alibi_shattered",
      title: "Alibi de Carlos Questionado",
      narrative:
        "A câmera de segurança da cozinha mostra Carlos sozinho por 8 minutos — tempo suficiente para adulterar o vinho. Ele havia dito 'apenas 2 minutos'.",
      updatesSuspectEmotion: { suspectId: "carlos", emotion: "lying" },
    },
    {
      id: "evt_carlos_confronted",
      chapter: 3,
      type: "suspect_breaks",
      title: "Carlos Confrontado",
      narrative:
        "Ao ver o relatório de auditoria, Carlos perde a compostura por um momento. 'Isso não prova nada.' Mas suas mãos tremem.",
      updatesSuspectEmotion: { suspectId: "carlos", emotion: "angry" },
    },
    {
      id: "evt_twist_isabela",
      chapter: 3,
      type: "red_herring",
      title: "Isabela e o Passado",
      narrative:
        "Isabela finalmente admite: ela passava informações corporativas para Carlos durante o relacionamento com Alice — mas não sabia que ele planejava matar Alice.",
      updatesSuspectEmotion: { suspectId: "isabela", emotion: "cooperative" },
    },
    {
      id: "evt_final_confession_hint",
      chapter: 4,
      type: "plot_twist",
      title: "A Última Página do Diário",
      narrative:
        "A última página do diário de Alice contém uma única frase: 'Se algo me acontecer, olhem para quem estava na cozinha por mais tempo.'",
    },
  ],

  finalTwist:
    "Isabela, sem saber do plano de Carlos, tentou protegê-lo ao esconder informações — tornando-se cúmplice involuntária. Ela precisará decidir se testemunha contra ele.",

  trueNarrative:
    "Carlos Mendonça planejou o crime por 2 semanas após descobrir que Alice havia contratado a auditoria. Ele obteve a tetrodotoxina através de um contato no mercado negro, escondeu o frasco na cozinha, e na noite do jantar usou a desculpa de 'buscar vinho' para adulterar a taça de Alice. A chave do armário — que ele copiou meses atrás — o traiu.",
};

// ────────────────────────────────────────────────────────────
// CASO 2 — "O HERDEIRO DE VALEMOOR" (Medieval)
// ────────────────────────────────────────────────────────────
export const CASE_VALEMOOR: InvestigationCase = {
  id: "valemoor",
  title: "O Herdeiro de Valemoor",
  tagline: "O rei morreu antes de assinar o testamento. Nenhum herdeiro tem as mãos limpas.",
  setting: "medieval",
  settingDescription:
    "Castelo Valemoor, ano 1347. O reino está em crise. O Rei Aldric caiu morto durante o banquete de coroação de seu herdeiro. Com o testamento não assinado, três filhos brigam pelo trono — e um deles matou o pai.",

  victim: {
    id: "aldric",
    name: "Rei Aldric de Valemoor",
    avatar: "👑",
    profession: "Rei do Reino de Valemoor",
    backstory:
      "Aldric governou por 40 anos com mão de ferro. Na véspera de seu 60º aniversário, anunciou que finalmente assinaria o testamento — nomeando apenas UM herdeiro.",
    secrets: [
      "Planejava deixar o reino para o filho bastardo secreto",
      "Sabia que um de seus filhos o odiava",
      "Tinha um pacto secreto com o Sacerdote Máximo",
    ],
  },

  killer: "prince_dorian",
  motive:
    "Dorian soube que seria preterido no testamento. Com o apoio do alquimista do castelo, envenenou o vinho do rei com extrato de cicuta misturado ao vinho especial da colheita.",

  suspects: [
    {
      id: "prince_dorian",
      name: "Príncipe Dorian",
      avatar: "🤴",
      profession: "Primeiro Herdeiro",
      alibi: "Estava discursando para os nobres durante o brinde",
      motive: "Sabia que seria excluído do testamento",
      isKiller: true,
      relationship: "victim_of",
      emotionByChapter: { 1: "calm", 2: "calm", 3: "hiding", 4: "nervous", 5: "angry" },
      truths: [
        "Sim, eu e meu pai divergíamos sobre a administração do reino.",
        "Estava no salão durante o brinde, todos viram.",
      ],
      lies: [
        "Nunca tive contato com o alquimista Morbius.",
        "Não sabia que o testamento me excluía.",
      ],
      omissions: [
        "Visitou o alquimista Morbius em segredo duas noites antes do banquete.",
        "Recebeu um frasco de 'remédio' de Morbius.",
      ],
      revealedAt: 3,
      accusationCount: 0,
    },
    {
      id: "princess_lyra",
      name: "Princesa Lyra",
      avatar: "👸",
      profession: "Segunda Herdeira / Diplomata",
      alibi: "Conversando com embaixadores estrangeiros",
      motive: "Queria o trono para expandir alianças comerciais",
      isKiller: false,
      relationship: "rival",
      emotionByChapter: { 1: "calm", 2: "calm", 3: "nervous", 4: "cooperative", 5: "cooperative" },
      truths: [
        "Eu queria o trono, sim. Todo herdeiro quer.",
        "Estava com os embaixadores — eles podem confirmar.",
      ],
      lies: ["Não tinha nenhuma informação sobre o conteúdo do testamento."],
      omissions: [
        "Havia contratado um espião para descobrir o conteúdo do testamento três semanas antes.",
      ],
      revealedAt: 3,
      accusationCount: 0,
    },
    {
      id: "morbius",
      name: "Alquimista Morbius",
      avatar: "🧙",
      profession: "Alquimista Real / Conselheiro",
      alibi: "Em seus aposentos preparando o elixir do aniversário do rei",
      motive: "Perderá sua posição se Dorian não assumir o trono",
      isKiller: false,
      relationship: "subordinate",
      emotionByChapter: { 1: "calm", 2: "hiding", 3: "nervous", 4: "lying", 5: "cooperative" },
      truths: [
        "Preparo elixires e remédios para a família real há 20 anos.",
        "O príncipe Dorian me visitou, sim — pediu um tônico para ansiedade.",
      ],
      lies: [
        "O tônico que dei ao príncipe era apenas ervas medicinais, inofensivo.",
      ],
      omissions: [
        "O frasco continha cicuta diluída em concentração suficiente para matar um homem idoso.",
        "Sabia exatamente o que Dorian pretendia fazer.",
      ],
      revealedAt: 4,
      accusationCount: 0,
    },
    {
      id: "lord_castan",
      name: "Lorde Castan",
      avatar: "🧔",
      profession: "Conselheiro Real / Primo do Rei",
      alibi: "Sentado ao lado do rei durante o jantar",
      motive: "Se nenhum herdeiro assumir, ele poderia pleitear o trono como parente mais próximo",
      isKiller: false,
      relationship: "rival",
      emotionByChapter: { 1: "calm", 2: "nervous", 3: "hiding", 4: "cooperative", 5: "cooperative" },
      truths: [
        "Estava ao lado do rei. Vi tudo, mas foi tão rápido.",
        "Sim, sou parente do rei e posso pleitear o trono legalmente.",
      ],
      lies: ["Quero apenas que a justiça seja feita."],
      omissions: ["Tentou persuadir o rei a não assinar o testamento nos dias anteriores."],
      revealedAt: 3,
      accusationCount: 0,
    },
  ],

  evidence: [
    {
      id: "ev_chalice",
      title: "Cálice Real",
      description:
        "O cálice de ouro usado pelo rei. Análise do sacerdote-médico detecta cicuta misturada ao vinho. A cicuta não estava na jarra — apenas no cálice do rei.",
      category: "forensic",
      emoji: "🏆",
      pointsTo: "prince_dorian",
      isFake: false,
      revealedInChapter: 1,
      linkedEvidenceIds: ["ev_vial", "ev_alchemist"],
    },
    {
      id: "ev_vial",
      title: "Frasco Vazio",
      description:
        "Frasco de vidro escuro encontrado no bolso da veste do príncipe Dorian durante a busca. Odor de ervas amargas. Traços de cicuta.",
      category: "physical",
      emoji: "⚗️",
      pointsTo: "prince_dorian",
      isFake: false,
      revealedInChapter: 2,
      linkedEvidenceIds: ["ev_chalice", "ev_alchemist"],
    },
    {
      id: "ev_alchemist",
      title: "Registro do Alquimista",
      description:
        "Livro de registros de Morbius. Entrada dois dias antes do banquete: 'Preparado frasco especial a pedido de D. — cicuta 3ml + vinho 10ml. Para uso único.'",
      category: "document",
      emoji: "📜",
      pointsTo: "prince_dorian",
      isFake: false,
      revealedInChapter: 3,
      linkedEvidenceIds: ["ev_vial", "ev_witness"],
    },
    {
      id: "ev_testament",
      title: "Rascunho do Testamento",
      description:
        "Rascunho encontrado nos aposentos reais. Dorian aparece riscado com uma anotação: 'Excluído por desonra — Reino para Lyra'. Não está assinado.",
      category: "document",
      emoji: "📋",
      pointsTo: "prince_dorian",
      isFake: false,
      revealedInChapter: 2,
      linkedEvidenceIds: ["ev_spy_letter"],
    },
    {
      id: "ev_spy_letter",
      title: "Carta do Espião de Lyra",
      description:
        "Carta interceptada: Lyra sabia do testamento e da exclusão de Dorian — mas a carta é de 3 semanas atrás. Ela sabia, mas Dorian também soube depois.",
      category: "document",
      emoji: "🕵️",
      pointsTo: null,
      isFake: false,
      revealedInChapter: 3,
      linkedEvidenceIds: ["ev_testament"],
    },
    {
      id: "ev_witness",
      title: "Testemunho do Copeiro",
      description:
        "O copeiro viu Dorian se aproximar do cálice do rei 'ajeitando a mesa' momentos antes do brinde. Dorian alega que estava arrumando os talheres.",
      category: "testimony",
      emoji: "👁️",
      pointsTo: "prince_dorian",
      isFake: false,
      revealedInChapter: 2,
      linkedEvidenceIds: ["ev_chalice"],
    },
    {
      id: "ev_fake_castan",
      title: "Carta 'Ameaçadora'",
      description:
        "Carta endereçada ao rei, assinada por 'C', pedindo que o testamento não seja assinado. Lorde Castan nega, mas a letra combina. Motivo: preservar o conselho atual.",
      category: "document",
      emoji: "📩",
      pointsTo: null,
      isFake: true,
      revealedInChapter: 2,
      linkedEvidenceIds: [],
    },
  ],

  chapters: [
    {
      chapter: 1,
      title: "A Queda do Rei",
      openingNarration: [
        "O banquete estava em seu auge quando o Rei Aldric levou o cálice aos lábios.",
        "Em poucos minutos, o rei estava no chão. A sala em silêncio.",
        "Os portões do castelo foram fechados. Ninguém sai até que o culpado seja encontrado.",
      ],
      availableActions: [
        "Examinar o cálice real",
        "Entrevistar as testemunhas presentes",
        "Inspecionar a cena do banquete",
      ],
      newEvidenceIds: ["ev_chalice"],
      newEventIds: ["evt_king_falls"],
      atmosphereNote: "Caos controlado. Cada herdeiro tenta parecer o mais inocente.",
    },
    {
      chapter: 2,
      title: "Segredos do Castelo",
      openingNarration: [
        "Com o primeiro dia de investigação concluído, novas descobertas surgem.",
        "O frasco no bolso do príncipe. O testamento riscado. O testemunho do copeiro.",
        "Mais de uma pessoa tinha motivo. Mas apenas uma teve oportunidade.",
      ],
      availableActions: [
        "Interrogar o Príncipe Dorian sobre o frasco",
        "Analisar o rascunho do testamento",
        "Ouvir o copeiro novamente",
        "Investigar os aposentos do alquimista",
      ],
      newEvidenceIds: ["ev_vial", "ev_testament", "ev_fake_castan", "ev_witness"],
      newEventIds: ["evt_vial_found", "evt_testament_revealed"],
      atmosphereNote: "Suspeitas crescem. Dorian fica cada vez mais defensivo.",
    },
    {
      chapter: 3,
      title: "O Alquimista Sabe",
      openingNarration: [
        "O livro de registros de Morbius foi encontrado escondido sob o laboratório.",
        "A entrada é clara. A data é clara. O nome é claro.",
        "Agora é preciso conectar todos os pontos.",
      ],
      availableActions: [
        "Confrontar Morbius com o livro de registros",
        "Investigar a relação entre Dorian e Morbius",
        "Analisar a carta do espião de Lyra",
        "Reconstruir linha do tempo do banquete",
      ],
      newEvidenceIds: ["ev_alchemist", "ev_spy_letter"],
      newEventIds: ["evt_morbius_cornered", "evt_lyra_spy_revealed"],
      atmosphereNote: "A verdade está quase completa. Falta uma última peça.",
    },
    {
      chapter: 4,
      title: "A Confissão do Alquimista",
      openingNarration: [
        "Morbius, confrontado com todas as evidências, finalmente fala.",
        "Cada palavra sua aperta o cerco em torno do Príncipe.",
        "Dorian percebe que o jogo acabou.",
      ],
      availableActions: [
        "Ouvir confissão de Morbius",
        "Confrontar Dorian com todas as evidências",
        "Montar o quadro investigativo final",
        "Preparar acusação",
      ],
      newEvidenceIds: [],
      newEventIds: ["evt_dorian_breaks"],
      atmosphereNote: "O momento da verdade está próximo.",
    },
    {
      chapter: 5,
      title: "O Tribunal Real",
      openingNarration: [
        "Os investigadores apresentam suas conclusões perante os nobres do reino.",
        "A acusação deve ser baseada nas evidências — não em teorias.",
        "Quem matou o Rei Aldric de Valemoor?",
      ],
      availableActions: ["Apresentar caso", "Nomear o culpado", "Votar"],
      newEvidenceIds: [],
      newEventIds: [],
      atmosphereNote: "O destino do reino depende da decisão correta.",
    },
  ],

  events: [
    {
      id: "evt_king_falls",
      chapter: 1,
      type: "evidence_found",
      title: "O Rei Cai",
      narrative:
        "O rei ergueu o cálice. Dois minutos depois, ele apertou o peito e caiu. Nenhum médico chegou a tempo. O sacerdote-médico suspeita de veneno.",
      unlocksEvidenceIds: ["ev_chalice"],
    },
    {
      id: "evt_vial_found",
      chapter: 2,
      type: "evidence_found",
      title: "Frasco no Bolso",
      narrative:
        "Durante a busca ordenada pelo conselho, a guarda encontra um frasco escuro no bolso do Príncipe Dorian. Ele empalidece visivelmente.",
      unlocksEvidenceIds: ["ev_vial"],
      updatesSuspectEmotion: { suspectId: "prince_dorian", emotion: "nervous" },
    },
    {
      id: "evt_testament_revealed",
      chapter: 2,
      type: "plot_twist",
      title: "O Testamento Riscado",
      narrative:
        "Nos aposentos do rei, encontra-se um rascunho do testamento. O nome de Dorian está riscado. A raiva que ele sentiria ao descobrir isso seria suficiente para motivar o crime.",
      unlocksEvidenceIds: ["ev_testament"],
    },
    {
      id: "evt_morbius_cornered",
      chapter: 3,
      type: "suspect_breaks",
      title: "Morbius Encurralado",
      narrative:
        "Ao ver seu livro de registros, Morbius fraqueja: 'Eu... apenas preparei o que me pediram. Não sabia que seria assim usado.' Sua voz treme.",
      updatesSuspectEmotion: { suspectId: "morbius", emotion: "nervous" },
    },
    {
      id: "evt_lyra_spy_revealed",
      chapter: 3,
      type: "red_herring",
      title: "O Espião de Lyra",
      narrative:
        "A carta do espião prova que Lyra soube do testamento — mas ANTES de Dorian. Ela tinha motivo, mas não o frasco, não o acesso, não o veneno.",
      updatesSuspectEmotion: { suspectId: "princess_lyra", emotion: "nervous" },
    },
    {
      id: "evt_dorian_breaks",
      chapter: 4,
      type: "suspect_breaks",
      title: "A Máscara Cai",
      narrative:
        "Com todas as evidências na mesa, Dorian finalmente grita: 'Ele ia me trair! Eu dediquei minha vida a este reino!' O silêncio que se segue é absoluto.",
      updatesSuspectEmotion: { suspectId: "prince_dorian", emotion: "angry" },
    },
  ],

  finalTwist:
    "Morbius sabia do plano e participou ativamente. Será julgado como cúmplice. Lyra, mesmo com o espião, é inocente do assassinato — mas terá que explicar suas ações ao novo conselho.",

  trueNarrative:
    "Dorian soube do testamento através de um criado corrompido. Em pânico, procurou Morbius, que preparou o veneno. Na noite do banquete, enquanto 'ajeitava a mesa', Dorian despejou o conteúdo do frasco no cálice do rei. Morbius foi cúmplice consciente.",
};

// ────────────────────────────────────────────────────────────
// ÍNDICE DE CASOS
// ────────────────────────────────────────────────────────────
export const ALL_CASES: InvestigationCase[] = [
  CASE_ULTIMO_JANTAR,
  CASE_VALEMOOR,
];

export function getCaseById(id: string): InvestigationCase | undefined {
  return ALL_CASES.find((c) => c.id === id);
}

export function getRandomCase(): InvestigationCase {
  return ALL_CASES[Math.floor(Math.random() * ALL_CASES.length)];
}
