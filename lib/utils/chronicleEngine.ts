// ============================================================
// ENGINE — Crônicas do Véu
// ============================================================
import type {
  ChronicleGameState,
  ChroniclePlayer,
  Kingdom,
  City,
  Faction,
  Prophecy,
  WorldEvent,
  NarrativeChoice,
  NarratorEntry,
  WorldState,
  CharacterClassDef,
  PlayerClass,
  KingdomId,
  FactionId,
  AlignmentPath,
} from "../types/chronicle";

// ────────────────────────────────────────────────────────────
// DEFINIÇÕES ESTÁTICAS
// ────────────────────────────────────────────────────────────
export const CHARACTER_CLASSES: CharacterClassDef[] = [
  {
    id: "sacred_warrior",
    name: "Guerreiro Sagrado",
    emoji: "⚔️",
    description: "Portador da espada divina. Defende o fraco, purga o corrompido.",
    ability: "Purificação: remove corrupção de uma cidade ou aliado",
    faithBonus: 15,
    corruptionResistance: 20,
    lore: "Criados na Ordem Celestial, os Guerreiros Sagrados jurariam sua vida para manter o equilíbrio entre luz e trevas.",
  },
  {
    id: "prophet",
    name: "Profeta",
    emoji: "🔥",
    description: "Receptor de visões divinas. Sua palavra move reinos e antecipa catástrofes.",
    ability: "Visão: revelar o próximo evento mundial antes que aconteça",
    faithBonus: 25,
    corruptionResistance: 10,
    lore: "Os Profetas caminham sozinhos pelos desertos de Azkar, ouvindo vozes que mais ninguém escuta.",
  },
  {
    id: "priest",
    name: "Sacerdote",
    emoji: "🕯️",
    description: "Mediador entre o divino e o humano. Cura, abençoa, exorciza.",
    ability: "Bênção: aumenta a fé de um reino por um capítulo inteiro",
    faithBonus: 20,
    corruptionResistance: 15,
    lore: "Os Sacerdotes de Zion guardam os textos sagrados e servem como conselheiros de reis.",
  },
  {
    id: "desert_hunter",
    name: "Caçador do Deserto",
    emoji: "🏹",
    description: "Sombra das areias. Rastreia ameaças antes que se tornem guerras.",
    ability: "Rastrear: revelar inimigos ocultos em qualquer reino",
    faithBonus: 5,
    corruptionResistance: 10,
    lore: "Originários das tribos nômades de Azkar, os Caçadores conhecem segredos que os reis nunca souberam.",
  },
  {
    id: "oracle",
    name: "Oráculo",
    emoji: "👁️",
    description: "Vê o que foi, o que é e o que ainda pode ser. Manipula o destino.",
    ability: "Previsão: escolher o resultado de uma profecia antes que se cumpra",
    faithBonus: 10,
    corruptionResistance: 5,
    lore: "Os Oráculos vivem na fronteira entre mundos, pagando um preço invisível por cada visão.",
  },
  {
    id: "corrupted",
    name: "O Corrompido",
    emoji: "🩸",
    description: "Fez pactos proibidos. Poder imenso — preço imprevisível.",
    ability: "Pacto Sombrio: ação com efeito duplo, mas corrupção aumenta",
    faithBonus: -10,
    corruptionResistance: -20,
    lore: "Ninguém escolhe a corrupção — ela escolhe você. Os que sucumbem aos Filhos do Abismo ganham poder que nenhum treinamento poderia dar.",
  },
];

export const KINGDOMS: Kingdom[] = [
  {
    id: "solareth",
    name: "Reino de Solareth",
    emoji: "☀️",
    description: "O reino da luz e da ordem. Construído sobre fundamentos sagrados.",
    capital: "Cidade Dourada de Ael",
    flavor: "Aqui, o sol nunca se põe completamente — e dizem que isso é um sinal divino.",
    stability: 80,
    corruption: 10,
    militaryPower: 70,
    faithLevel: 90,
    rulerName: "Rei Aldras",
    rulerTitle: "Guardião da Luz",
    rulerEmoji: "👑",
    allies: ["zion"],
    enemies: ["nethram"],
    color: "amber",
  },
  {
    id: "nethram",
    name: "Império de Nethram",
    emoji: "🏛️",
    description: "Riqueza que corrompe. Poder que seduz. O império que consome tudo.",
    capital: "Valek, Cidade dos Mil Mercadores",
    flavor: "Em Nethram, tudo tem preço. Até a alma.",
    stability: 60,
    corruption: 75,
    militaryPower: 90,
    faithLevel: 20,
    rulerName: "Imperador Malak",
    rulerTitle: "Senhor dos Sete Tronos",
    rulerEmoji: "🗡️",
    allies: [],
    enemies: ["solareth", "zion"],
    color: "red",
  },
  {
    id: "azkar",
    name: "Desertos de Azkar",
    emoji: "🏜️",
    description: "Terra dos profetas e tribos antigas. Onde o divino ainda fala diretamente.",
    capital: "Ashur, Fortaleza das Dunas",
    flavor: "O silêncio do deserto carrega mais verdades do que qualquer palácio.",
    stability: 50,
    corruption: 25,
    militaryPower: 55,
    faithLevel: 75,
    rulerName: "Anciã Miriam",
    rulerTitle: "Portadora das Tábuas",
    rulerEmoji: "📜",
    allies: ["zion"],
    enemies: ["nethram"],
    color: "yellow",
  },
  {
    id: "elnor",
    name: "Reino Congelado de Elnor",
    emoji: "❄️",
    description: "Guerreiros espirituais temperados pelo frio eterno. Sua fé é gelo e aço.",
    capital: "Fortaleza de Vael",
    flavor: "O frio de Elnor não mata o corpo — mata a covardia.",
    stability: 70,
    corruption: 15,
    militaryPower: 85,
    faithLevel: 65,
    rulerName: "Rainha Seraphel",
    rulerTitle: "Lâmina do Norte Eterno",
    rulerEmoji: "🗡️",
    allies: ["solareth"],
    enemies: ["nethram"],
    color: "blue",
  },
  {
    id: "zion",
    name: "Cidade Sagrada de Zion",
    emoji: "✨",
    description: "Centro espiritual do mundo. Onde os véus entre mundos são mais finos.",
    capital: "Zion — a cidade É a capital",
    flavor: "Dizem que em certas noites, em Zion, você pode ouvir cânticos de outro mundo.",
    stability: 90,
    corruption: 5,
    militaryPower: 40,
    faithLevel: 100,
    rulerName: "Sumo Sacerdote Oren",
    rulerTitle: "Guardião do Véu",
    rulerEmoji: "✝️",
    allies: ["solareth", "azkar"],
    enemies: ["nethram"],
    color: "purple",
  },
];

export const FACTIONS: Faction[] = [
  {
    id: "celestial",
    name: "Ordem Celestial",
    emoji: "🕊️",
    description: "Sacerdotes, profetas e paladinos que servem à luz.",
    philosophy: "A fé é a única armadura que não enferruja.",
    power: 70,
    members: ["sacred_warrior", "prophet", "priest"],
    goal: "Manter os Véus intactos e proteger os reinos da corrupção.",
  },
  {
    id: "abyss",
    name: "Filhos do Abismo",
    emoji: "🩸",
    description: "Aqueles que cruzaram a linha. Poder sem limites — mas a que custo?",
    philosophy: "O que os deuses te negam, você pode tomar.",
    power: 55,
    members: ["corrupted"],
    goal: "Rasgar o Véu e trazer o Abismo para o mundo material.",
  },
  {
    id: "veil",
    name: "Vigias do Véu",
    emoji: "👁️",
    description: "Espiões, assassinos, diplomatas. Estão em todos os lados.",
    philosophy: "A verdade é uma arma. Nós a guardamos.",
    power: 60,
    members: ["oracle", "desert_hunter"],
    goal: "Manter o equilíbrio de poder — nem luz total, nem trevas totais.",
  },
];

// ────────────────────────────────────────────────────────────
// PROFECIAS
// ────────────────────────────────────────────────────────────
export const BASE_PROPHECIES: Prophecy[] = [
  {
    id: "prop_eclipse",
    text: "Quando o terceiro eclipse cobrir Zion, um falso rei erguerá seu trono sobre cinzas sagradas.",
    interpretation: "Um líder corrompido tentará tomar a Cidade Sagrada.",
    triggerCondition: "chapter >= 3 && worldState.eclipse == true",
    isFulfilled: false,
    isActive: false,
    chapter: 3,
    consequences: [
      { type: "kingdom_corruption", targetId: "zion", delta: 30, description: "Corrupção entra em Zion" },
      { type: "trigger_event", targetId: "war_for_zion", delta: 1, description: "Guerra por Zion iniciada" },
    ],
  },
  {
    id: "prop_prophet_rises",
    text: "Das areias de Azkar surgirá uma voz que fará reis tremerem e exércitos recuarem sem batalha.",
    interpretation: "Um Profeta de Azkar ganhará influência decisiva no mundo.",
    triggerCondition: "player.class == 'prophet' && player.faith >= 70",
    isFulfilled: false,
    isActive: true,
    chapter: 2,
    consequences: [
      { type: "faction_power", targetId: "celestial", delta: 20, description: "Ordem Celestial fortalecida" },
      { type: "kingdom_faith", targetId: "azkar", delta: 25, description: "Fé em Azkar aumenta" },
    ],
  },
  {
    id: "prop_betrayal",
    text: "O aliado mais próximo da luz guardará uma faca nas sombras. A traição virá de dentro do templo.",
    interpretation: "Alguém da Ordem Celestial cometerá uma traição.",
    triggerCondition: "chapter >= 2",
    isFulfilled: false,
    isActive: true,
    chapter: 2,
    consequences: [
      { type: "faction_power", targetId: "celestial", delta: -20, description: "Ordem Celestial enfraquecida" },
      { type: "kingdom_stability", targetId: "zion", delta: -15, description: "Zion desestabilizada" },
    ],
  },
  {
    id: "prop_corruption_flood",
    text: "Se três reinos sucumbirem à corrupção, o Véu começará a rasgar — e o que está do outro lado começará a ver.",
    interpretation: "Alta corrupção mundial ativa uma invasão espiritual.",
    triggerCondition: "kingdoms_corrupted >= 3",
    isFulfilled: false,
    isActive: false,
    chapter: 4,
    consequences: [
      { type: "trigger_event", targetId: "spiritual_invasion", delta: 1, description: "Invasão espiritual inicia" },
      { type: "kingdom_corruption", targetId: "nethram", delta: 40, description: "Nethram é consumido" },
    ],
  },
  {
    id: "prop_chosen_one",
    text: "Virá um entre os caminhantes do mundo que carregará o peso de todos os véus. Sua fé moverá o impossível.",
    interpretation: "O jogador com maior fé poderá realizar um milagre mundial.",
    triggerCondition: "player.faith >= 90",
    isFulfilled: false,
    isActive: true,
    chapter: 1,
    consequences: [
      { type: "kingdom_faith", targetId: "solareth", delta: 30, description: "Fé em Solareth explode" },
      { type: "faction_power", targetId: "celestial", delta: 30, description: "Ordem Celestial no auge" },
    ],
  },
];

// ────────────────────────────────────────────────────────────
// EVENTOS MUNDIAIS
// ────────────────────────────────────────────────────────────
export const WORLD_EVENTS: WorldEvent[] = [
  {
    id: "evt_eclipse_ch1",
    type: "eclipse",
    title: "O Eclipse de Sangue",
    emoji: "🌑",
    narrative: [
      "Os céus acima de Zion escureceram sem aviso.",
      "O sol desapareceu por três horas — e quando voltou, estava vermelho como sangue.",
      "Em todos os reinos, crianças pararam de brincar. Sacerdotes saíram às ruas.",
      "Os Vigias do Véu enviaram mensageiros urgentes: 'Isso não era previsto.'",
    ],
    affectedKingdoms: ["zion", "solareth", "azkar"],
    chapter: 1,
    effects: [
      { type: "kingdom_faith", targetId: "zion", delta: -10, description: "Dúvida começa a se espalhar" },
      { type: "kingdom_corruption", targetId: "nethram", delta: 10, description: "Nethram aproveita o caos" },
    ],
    isActive: true,
  },
  {
    id: "evt_plague_nethram",
    type: "plague",
    title: "A Praga das Sombras",
    emoji: "☠️",
    narrative: [
      "Começou nos portos de Valek — homens com a pele escurecendo, olhos brancos.",
      "Os médicos de Nethram chamaram de febre do comércio. Os sacerdotes chamaram de maldição.",
      "Em uma semana, três cidades do império estavam quarentenadas.",
      "O Imperador Malak fechou as fronteiras. Tarde demais.",
    ],
    affectedKingdoms: ["nethram"],
    chapter: 2,
    effects: [
      { type: "kingdom_stability", targetId: "nethram", delta: -25, description: "Nethram desestabilizado" },
      { type: "kingdom_corruption", targetId: "nethram", delta: 15, description: "Desespero gera mais pactos" },
    ],
    isActive: false,
  },
  {
    id: "evt_war_borders",
    type: "war",
    title: "A Guerra das Fronteiras",
    emoji: "⚔️",
    narrative: [
      "Tropas de Nethram cruzaram a fronteira de Solareth ao amanhecer.",
      "Não havia declaração de guerra. Apenas fogo e aço.",
      "O Rei Aldras convocou todos os guerreiros sagrados disponíveis.",
      "A profecia disse que isso viria. Ninguém acreditou a tempo.",
    ],
    affectedKingdoms: ["nethram", "solareth"],
    chapter: 2,
    effects: [
      { type: "kingdom_stability", targetId: "solareth", delta: -20, description: "Solareth em guerra" },
      { type: "kingdom_stability", targetId: "nethram", delta: -15, description: "Nethram estendido" },
    ],
    isActive: false,
  },
  {
    id: "evt_miracle_zion",
    type: "miracle",
    title: "O Milagre de Zion",
    emoji: "✨",
    narrative: [
      "Testemunhas relataram luz visível a 50 léguas de distância.",
      "O Sumo Sacerdote Oren saiu do templo com os olhos fechados — e curou treze enfermos.",
      "Peregrinos de todos os reinos partiram para Zion.",
      "Dizem que os Filhos do Abismo recuaram três dias após o evento.",
    ],
    affectedKingdoms: ["zion", "azkar", "solareth"],
    chapter: 1,
    effects: [
      { type: "kingdom_faith", targetId: "zion", delta: 20, description: "Fé explode em Zion" },
      { type: "faction_power", targetId: "celestial", delta: 15, description: "Ordem Celestial cresce" },
    ],
    isActive: false,
  },
  {
    id: "evt_spiritual_invasion",
    type: "judgment",
    title: "O Rasgo no Véu",
    emoji: "🌀",
    narrative: [
      "Em seis regiões simultaneamente, pessoas viram as mesmas criaturas.",
      "Não eram animais. Não eram humanos. Eram o que existe entre os mundos.",
      "Os Vigias do Véu confirmaram: o Véu está se rasgando.",
      "O que está do outro lado começou a ver — e a empurrar.",
    ],
    affectedKingdoms: ["zion", "solareth", "nethram", "azkar", "elnor"],
    chapter: 4,
    effects: [
      { type: "kingdom_corruption", targetId: "nethram", delta: 40, description: "Nethram consumido" },
      { type: "kingdom_faith", targetId: "zion", delta: -30, description: "Zion ameaçada" },
    ],
    isActive: false,
  },
];

// ────────────────────────────────────────────────────────────
// ESCOLHAS NARRATIVAS
// ────────────────────────────────────────────────────────────
export const NARRATIVE_CHOICES: NarrativeChoice[] = [
  {
    id: "choice_1",
    title: "O Mendigo Profeta",
    emoji: "👴",
    description:
      "Um velho esfarrapado bloqueia seu caminho em Zion. Ele murmura profecias que parecem impossíveis — mas três delas já aconteceram hoje.",
    context: "Capítulo 1 — Chegada a Zion",
    chapter: 1,
    isResolved: false,
    options: [
      {
        id: "c1_opt1",
        label: "Ouvir e ajudar",
        description: "Fica com o velho, registra tudo que ele diz, garante sua segurança.",
        emoji: "🕊️",
        impacts: ["faith_gain", "trigger_prophecy"],
        faithDelta: 15,
        corruptionDelta: 0,
        narratorResponse:
          "Você sentou com o velho até o sol se pôr. Suas palavras eram confusas — mas havia algo vivo nelas. Três dias depois, o Sumo Sacerdote te chamou pessoalmente. O velho havia desaparecido sem deixar rastro.",
        unlocksProphecyId: "prop_chosen_one",
      },
      {
        id: "c1_opt2",
        label: "Ignorar e seguir",
        description: "Não há tempo para mendigos. Sua missão é mais urgente.",
        emoji: "🚶",
        impacts: ["faith_loss"],
        faithDelta: -5,
        corruptionDelta: 0,
        narratorResponse:
          "Você passou por ele sem olhar. À noite, soube que guardas de Nethram o haviam preso — acusado de subversão. Você o esqueceu rapidamente. Ele, provavelmente, não te esqueceu.",
      },
      {
        id: "c1_opt3",
        label: "Prender como espião",
        description: "Pode ser um agente de Nethram disfarçado. Entregar às autoridades.",
        emoji: "⛓️",
        impacts: ["faith_loss", "corruption_gain", "kingdom_favor"],
        faithDelta: -10,
        corruptionDelta: 8,
        narratorResponse:
          "As autoridades te agradeceram. O velho foi levado. Mas naquela noite você sonhou com fogo descendo sobre uma cidade — e o velho olhando para você do meio das chamas, sem expressão.",
        worldEffect: {
          type: "kingdom_faith",
          targetId: "zion",
          delta: -5,
          description: "Paranoia se espalha em Zion",
        },
      },
    ],
  },
  {
    id: "choice_2",
    title: "O General de Nethram",
    emoji: "⚔️",
    description:
      "Um general do Império de Nethram se aproxima com uma oferta: informações sobre um plano de invasão a Solareth, em troca de imunidade e proteção para sua família.",
    context: "Capítulo 2 — Fronteira entre reinos",
    chapter: 2,
    isResolved: false,
    options: [
      {
        id: "c2_opt1",
        label: "Aceitar e proteger",
        description: "Aceitar as informações, garantir a segurança da família dele.",
        emoji: "🤝",
        impacts: ["faith_gain", "kingdom_favor"],
        faithDelta: 10,
        corruptionDelta: 0,
        narratorResponse:
          "O general chorou ao assinar o acordo. Suas informações salvaram dois mil soldados de Solareth de uma emboscada. Ele passou o resto da vida em anonimato. Ninguém soube seu nome — exceto você.",
        worldEffect: {
          type: "kingdom_stability",
          targetId: "solareth",
          delta: 15,
          description: "Solareth evita desastre militar",
        },
      },
      {
        id: "c2_opt2",
        label: "Rejeitar e reportar",
        description: "Relatar ao Rei Aldras a tentativa de deserção. Honra acima de tudo.",
        emoji: "📜",
        impacts: ["faith_gain", "kingdom_favor"],
        faithDelta: 8,
        corruptionDelta: -5,
        narratorResponse:
          "O general foi capturado em sua própria tenda. Solareth ganhou um prisioneiro valioso. Mas a família do general fugiu para Nethram — e você soube depois que a criança mais nova não chegou.",
      },
      {
        id: "c2_opt3",
        label: "Usar as informações e trair o general",
        description: "Aceitar os dados, então entregá-lo a Nethram por recompensa.",
        emoji: "🗡️",
        impacts: ["corruption_gain", "faith_loss", "betrayal"],
        faithDelta: -20,
        corruptionDelta: 20,
        narratorResponse:
          "O ouro pesava nas mãos. As informações eram valiosas. Mas naquela noite, pela primeira vez, você acordou com um gosto de cinzas na boca — e não conseguiu mais dormir como antes.",
        worldEffect: {
          type: "faction_power",
          targetId: "abyss",
          delta: 10,
          description: "Filhos do Abismo notam o movimento",
        },
      },
    ],
  },
  {
    id: "choice_3",
    title: "O Templo em Chamas",
    emoji: "🔥",
    description:
      "Um templo menor de Solareth está em chamas. Ainda há pessoas dentro — mas as chamas parecem alimentadas por algo sobrenatural. Seus aliados recuam com medo.",
    context: "Capítulo 2 — Distrito sagrado de Ael",
    chapter: 2,
    isResolved: false,
    options: [
      {
        id: "c3_opt1",
        label: "Entrar nas chamas",
        description: "Fé move montanhas. Entrar e resgatar os que estão dentro.",
        emoji: "🕊️",
        impacts: ["faith_gain", "faction_rise"],
        faithDelta: 25,
        corruptionDelta: -5,
        narratorResponse:
          "Você entrou. As chamas tocaram você — e recuaram. Não completamente, mas o suficiente. Você saiu com quatro sobreviventes nos braços. As pessoas na rua ficaram em silêncio absoluto. Depois, choraram.",
        worldEffect: {
          type: "kingdom_faith",
          targetId: "solareth",
          delta: 20,
          description: "Milagre inspira Solareth",
        },
        unlocksProphecyId: "prop_chosen_one",
      },
      {
        id: "c3_opt2",
        label: "Organizar resgate coordenado",
        description: "Pragmático. Organizar água, cordas, saída segura. Mínimo de risco.",
        emoji: "📋",
        impacts: ["faith_gain"],
        faithDelta: 5,
        corruptionDelta: 0,
        narratorResponse:
          "A organização salvou dois. Três não resistiram ao fumo. Você fez o que era possível com o que tinha. Tarde da noite, o sacerdote-chefe disse: 'Você foi sábio. Mas às vezes sabedoria e coragem precisam ser a mesma coisa.'",
      },
      {
        id: "c3_opt3",
        label: "Deixar queimar — investigar a origem",
        description: "Fogo sobrenatural tem origem. Encontrar a causa é mais importante.",
        emoji: "🔍",
        impacts: ["faction_rise", "faith_loss"],
        faithDelta: -10,
        corruptionDelta: 5,
        narratorResponse:
          "Você encontrou marcas rituais nos alicerces. Os Filhos do Abismo estiveram aqui. Essa informação foi crucial — mas os que morreram no templo naquela noite eram nomes que você vai carregar.",
        worldEffect: {
          type: "faction_power",
          targetId: "abyss",
          delta: -15,
          description: "Plano dos Filhos do Abismo parcialmente exposto",
        },
      },
    ],
  },
  {
    id: "choice_4",
    title: "O Pacto Proibido",
    emoji: "🩸",
    description:
      "Um mensageiro dos Filhos do Abismo chega com uma proposta: poder para terminar a guerra imediatamente, em troca de um pequeno 'sacrifício espiritual'.",
    context: "Capítulo 3 — Auge da guerra",
    chapter: 3,
    isResolved: false,
    options: [
      {
        id: "c4_opt1",
        label: "Recusar com violência",
        description: "Destruir o mensageiro e a mensagem. Isso não existiu.",
        emoji: "⚔️",
        impacts: ["faith_gain", "faction_fall"],
        faithDelta: 15,
        corruptionDelta: -10,
        narratorResponse:
          "O mensageiro desintegrou-se em sombra ao ser golpeado pela sua arma sagrada. Mas algo ficou — um sussurro. 'Você sabe onde nos encontrar quando mudar de ideia.'",
        worldEffect: {
          type: "faction_power",
          targetId: "abyss",
          delta: -10,
          description: "Filhos do Abismo repelidos",
        },
      },
      {
        id: "c4_opt2",
        label: "Fingir aceitar — usar como informação",
        description: "Jogar o jogo deles para descobrir seus planos.",
        emoji: "👁️",
        impacts: ["corruption_gain", "faith_loss"],
        faithDelta: -10,
        corruptionDelta: 15,
        narratorResponse:
          "Você aprendeu muito. Os planos deles, os nomes, os rituais. Mas ao mentir para o Abismo, você abriu uma fissura em algo dentro de si. Informação tem custo. Esse custo ainda será cobrado.",
      },
      {
        id: "c4_opt3",
        label: "Aceitar o pacto",
        description: "A guerra precisa terminar. Qualquer preço vale.",
        emoji: "🩸",
        impacts: ["corruption_gain", "faith_loss", "trigger_war"],
        faithDelta: -35,
        corruptionDelta: 40,
        narratorResponse:
          "A guerra terminou. Você foi o herói que nenhum bardo vai cantar. Mas à noite, quando você olha para o espelho, há algo nos seus olhos que não estava lá antes. Os sacerdotes de Zion cruzam a rua quando você passa.",
        worldEffect: {
          type: "kingdom_corruption",
          targetId: "nethram",
          delta: -30,
          description: "Guerra interrompida por meios sombrios",
        },
      },
    ],
  },
];

// ────────────────────────────────────────────────────────────
// INICIALIZAR JOGO
// ────────────────────────────────────────────────────────────
export function initChronicleGame(
  nickname: string,
  avatar: string,
  playerClass: PlayerClass,
  kingdom: KingdomId
): ChronicleGameState {
  const classDef = CHARACTER_CLASSES.find((c) => c.id === playerClass)!;
  const factionId: FactionId =
    playerClass === "corrupted"
      ? "abyss"
      : playerClass === "oracle" || playerClass === "desert_hunter"
      ? "veil"
      : "celestial";

  const alignment: AlignmentPath =
    playerClass === "corrupted" ? "shadow" : "light";

  const initialFaith = 50 + classDef.faithBonus;
  const initialCorruption = playerClass === "corrupted" ? 30 : 0;

  const player: ChroniclePlayer = {
    id: `player_${Date.now()}`,
    nickname,
    avatar,
    class: playerClass,
    kingdom,
    faction: factionId,
    faith: Math.min(100, Math.max(0, initialFaith)),
    corruption: initialCorruption,
    alignment,
    reputation: 50,
    title: getTitle(playerClass, 50, 0),
    completedChoices: [],
    witnessedEvents: [],
    stats: {
      miraclesPerformed: 0,
      betrayalsCommitted: 0,
      livesProtected: 0,
      propheciesFulfilled: 0,
      warsFought: 0,
    },
    appearance: "pure",
  };

  const worldState: WorldState = {
    eclipse: false,
    plague: false,
    warActive: false,
    divinePresence: 60,
    chaosLevel: 20,
    holyCityIntact: true,
    skyColor: "golden",
  };

  const openingNarration: NarratorEntry[] = [
    {
      id: "n_open_1",
      chapter: 1,
      text: `O mundo de Valemoor existe na borda de dois reinos — o visível e o invisível.`,
      type: "divine",
      timestamp: Date.now(),
    },
    {
      id: "n_open_2",
      chapter: 1,
      text: `Os Véus que separam esses mundos estão, há gerações, se tornando mais finos.`,
      type: "warning",
      timestamp: Date.now() + 100,
    },
    {
      id: "n_open_3",
      chapter: 1,
      text: `Você chega a este mundo como ${classDef.name} — originário do reino de ${KINGDOMS.find((k) => k.id === kingdom)?.name}.`,
      type: "neutral",
      timestamp: Date.now() + 200,
    },
    {
      id: "n_open_4",
      chapter: 1,
      text: `As profecias falam de alguém como você. O que você fará com esse peso?`,
      type: "prophecy",
      timestamp: Date.now() + 300,
    },
  ];

  // Ativar primeiro evento e primeiras escolhas
  const activeEvents = WORLD_EVENTS.filter((e) => e.chapter === 1 && e.isActive).map((e) => ({
    ...e,
    isActive: true,
  }));

  const availableChoices = NARRATIVE_CHOICES.filter((c) => c.chapter === 1);
  const activeProphecies = BASE_PROPHECIES.filter((p) => p.isActive);

  return {
    player,
    chapter: 1,
    worldAge: "Era do Primeiro Véu",
    kingdoms: KINGDOMS.map((k) => ({ ...k })),
    cities: buildInitialCities(),
    factions: FACTIONS.map((f) => ({ ...f })),
    activeProphecies,
    fulfilledProphecies: [],
    activeEvents,
    pastEvents: [],
    availableChoices,
    resolvedChoices: [],
    narratorLog: openingNarration,
    worldState,
    startedAt: Date.now(),
    lastActionAt: Date.now(),
  };
}

function buildInitialCities(): City[] {
  return [
    { id: "ael", name: "Cidade Dourada de Ael", kingdomId: "solareth", emoji: "🌅", description: "Capital de Solareth, banhada em ouro.", population: "large", isCapital: true, faithLevel: 90, corruptionLevel: 5, status: "thriving" },
    { id: "valek", name: "Valek", kingdomId: "nethram", emoji: "🏛️", description: "Cidade dos Mil Mercadores.", population: "large", isCapital: true, faithLevel: 15, corruptionLevel: 80, status: "troubled" },
    { id: "ashur", name: "Ashur", kingdomId: "azkar", emoji: "🏜️", description: "Fortaleza das Dunas.", population: "medium", isCapital: true, faithLevel: 75, corruptionLevel: 20, status: "thriving" },
    { id: "vael", name: "Fortaleza de Vael", kingdomId: "elnor", emoji: "❄️", description: "Capital de pedra e gelo.", population: "medium", isCapital: true, faithLevel: 65, corruptionLevel: 15, status: "thriving" },
    { id: "zion_city", name: "Zion", kingdomId: "zion", emoji: "✨", description: "A Cidade Sagrada.", population: "medium", isCapital: true, faithLevel: 100, corruptionLevel: 5, status: "holy" },
    { id: "port_marak", name: "Porto de Marak", kingdomId: "nethram", emoji: "⚓", description: "Porto corrupto de Nethram.", population: "medium", isCapital: false, faithLevel: 10, corruptionLevel: 90, status: "troubled" },
  ];
}

// ────────────────────────────────────────────────────────────
// RESOLVER ESCOLHA
// ────────────────────────────────────────────────────────────
export function resolveChoice(
  state: ChronicleGameState,
  choiceId: string,
  optionId: string
): ChronicleGameState {
  const choice = state.availableChoices.find((c) => c.id === choiceId);
  if (!choice || choice.isResolved) return state;

  const option = choice.options.find((o) => o.id === optionId);
  if (!option) return state;

  // Atualizar jogador
  const newFaith = Math.min(100, Math.max(0, state.player.faith + option.faithDelta));
  const newCorruption = Math.min(100, Math.max(0, state.player.corruption + option.corruptionDelta));
  const newAlignment = computeAlignment(newFaith, newCorruption);
  const newAppearance = computeAppearance(newCorruption, newFaith);
  const newTitle = getTitle(state.player.class, newFaith, newCorruption);

  const updatedPlayer: ChroniclePlayer = {
    ...state.player,
    faith: newFaith,
    corruption: newCorruption,
    alignment: newAlignment,
    appearance: newAppearance,
    title: newTitle,
    completedChoices: [...state.player.completedChoices, choiceId],
    stats: {
      ...state.player.stats,
      betrayalsCommitted:
        option.impacts.includes("betrayal")
          ? state.player.stats.betrayalsCommitted + 1
          : state.player.stats.betrayalsCommitted,
    },
  };

  // Aplicar efeito mundial
  let updatedKingdoms = [...state.kingdoms];
  if (option.worldEffect) {
    updatedKingdoms = applyWorldEffect(updatedKingdoms, option.worldEffect);
  }

  // Narrador
  const narratorEntry: NarratorEntry = {
    id: `n_choice_${Date.now()}`,
    chapter: state.chapter,
    text: option.narratorResponse,
    type: option.faithDelta > 0 ? "miracle" : option.corruptionDelta > 0 ? "dark" : "neutral",
    timestamp: Date.now(),
  };

  // Desbloquear profecia
  let updatedProphecies = [...state.activeProphecies];
  if (option.unlocksProphecyId) {
    const toUnlock = BASE_PROPHECIES.find((p) => p.id === option.unlocksProphecyId);
    if (toUnlock && !updatedProphecies.find((p) => p.id === toUnlock.id)) {
      const propEntry: NarratorEntry = {
        id: `n_prop_${Date.now()}`,
        chapter: state.chapter,
        text: `✦ PROFECIA REVELADA: "${toUnlock.text}"`,
        type: "prophecy",
        timestamp: Date.now() + 50,
      };
      updatedProphecies = [...updatedProphecies, toUnlock];
      return {
        ...state,
        player: updatedPlayer,
        kingdoms: updatedKingdoms,
        activeProphecies: updatedProphecies,
        availableChoices: state.availableChoices.map((c) =>
          c.id === choiceId ? { ...c, isResolved: true, chosenOptionId: optionId } : c
        ),
        resolvedChoices: [...state.resolvedChoices, { ...choice, isResolved: true, chosenOptionId: optionId }],
        narratorLog: [...state.narratorLog, narratorEntry, propEntry],
        lastActionAt: Date.now(),
      };
    }
  }

  return {
    ...state,
    player: updatedPlayer,
    kingdoms: updatedKingdoms,
    activeProphecies: updatedProphecies,
    availableChoices: state.availableChoices.map((c) =>
      c.id === choiceId ? { ...c, isResolved: true, chosenOptionId: optionId } : c
    ),
    resolvedChoices: [...state.resolvedChoices, { ...choice, isResolved: true, chosenOptionId: optionId }],
    narratorLog: [...state.narratorLog, narratorEntry],
    lastActionAt: Date.now(),
  };
}

function applyWorldEffect(kingdoms: Kingdom[], effect: { type: string; targetId: string; delta: number }): Kingdom[] {
  return kingdoms.map((k) => {
    if (k.id !== effect.targetId) return k;
    if (effect.type === "kingdom_stability") return { ...k, stability: clamp(k.stability + effect.delta) };
    if (effect.type === "kingdom_corruption") return { ...k, corruption: clamp(k.corruption + effect.delta) };
    if (effect.type === "kingdom_faith") return { ...k, faithLevel: clamp(k.faithLevel + effect.delta) };
    return k;
  });
}

// ────────────────────────────────────────────────────────────
// AVANÇAR CAPÍTULO
// ────────────────────────────────────────────────────────────
export function advanceChronicleChapter(state: ChronicleGameState): ChronicleGameState {
  const nextChapter = state.chapter + 1;
  if (nextChapter > 5) return state;

  const newEvents = WORLD_EVENTS.filter((e) => e.chapter === nextChapter);
  const newChoices = NARRATIVE_CHOICES.filter((c) => c.chapter === nextChapter);
  const chaosDelta = computeChaosDelta(state);

  const chapterNarrations = getChapterOpeningNarration(nextChapter, state);

  // Verificar profecias cumpridas
  const { fulfilled, remaining } = checkProphecies(state, nextChapter);

  const updatedWorldState: WorldState = {
    ...state.worldState,
    eclipse: nextChapter === 3 || state.worldState.eclipse,
    warActive: newEvents.some((e) => e.type === "war") || state.worldState.warActive,
    chaosLevel: clamp(state.worldState.chaosLevel + chaosDelta),
    divinePresence: clamp(state.worldState.divinePresence + (state.player.faith > 60 ? 5 : -5)),
    skyColor: getSkyColor(state.player.corruption, state.worldState.chaosLevel + chaosDelta),
  };

  return {
    ...state,
    chapter: nextChapter,
    worldAge: getWorldAge(nextChapter),
    activeEvents: [...state.activeEvents.filter((e) => e.chapter === nextChapter), ...newEvents],
    pastEvents: [...state.pastEvents, ...state.activeEvents.filter((e) => e.chapter !== nextChapter)],
    availableChoices: [...state.availableChoices.filter((c) => !c.isResolved), ...newChoices],
    activeProphecies: remaining,
    fulfilledProphecies: [...state.fulfilledProphecies, ...fulfilled],
    worldState: updatedWorldState,
    narratorLog: [...state.narratorLog, ...chapterNarrations],
    player: {
      ...state.player,
      stats: {
        ...state.player.stats,
        propheciesFulfilled: state.player.stats.propheciesFulfilled + fulfilled.length,
      },
    },
    lastActionAt: Date.now(),
  };
}

function getChapterOpeningNarration(chapter: number, state: ChronicleGameState): NarratorEntry[] {
  const lines: Record<number, string[]> = {
    2: [
      "O tempo passou. Os reinos mudaram. O Véu ficou mais fino.",
      "Rumores chegam de todas as direções — nem todos são rumores.",
      `Em ${KINGDOMS.find((k) => k.id === state.player.kingdom)?.name}, as pessoas começam a te conhecer pelo nome.`,
    ],
    3: [
      "O terceiro eclipse foi visto por todos os reinos ao mesmo tempo.",
      "A profecia mencionava um falso rei. Ninguém sabe ainda quem é.",
      "Os Filhos do Abismo se movem com mais ousadia agora.",
    ],
    4: [
      "O mundo está se partindo em duas forças.",
      "Cada escolha que você fez chegou até aqui de alguma forma.",
      "O Sumo Sacerdote de Zion enviou mensageiros urgentes para você.",
    ],
    5: [
      "Este é o capítulo final. O que foi plantado será colhido.",
      "Os Véus estão no ponto mais fino da história do mundo.",
      "O que você decide agora será narrado por gerações — ou esquecido com o colapso.",
    ],
  };

  return (lines[chapter] ?? ["O mundo continua. Mas nada é como era."]).map<NarratorEntry>((text, i) => ({
    id: `n_ch${chapter}_${i}`,
    chapter,
    text,
    type: chapter >= 4 ? "warning" : "neutral",
    timestamp: Date.now() + i * 100,
  }));
}

function checkProphecies(state: ChronicleGameState, chapter: number): {
  fulfilled: Prophecy[];
  remaining: Prophecy[];
} {
  const fulfilled: Prophecy[] = [];
  const remaining: Prophecy[] = [];

  for (const prop of state.activeProphecies) {
    if (prop.chapter <= chapter && state.player.faith >= 70 && prop.id === "prop_chosen_one") {
      fulfilled.push({ ...prop, isFulfilled: true });
    } else {
      remaining.push(prop);
    }
  }

  return { fulfilled, remaining };
}

function computeChaosDelta(state: ChronicleGameState): number {
  let delta = 0;
  if (state.player.corruption > 50) delta += 5;
  if (state.worldState.warActive) delta += 8;
  if (state.worldState.eclipse) delta += 3;
  if (state.player.faith > 70) delta -= 5;
  return delta;
}

function getSkyColor(corruption: number, chaos: number): WorldState["skyColor"] {
  if (corruption > 70 || chaos > 80) return "black";
  if (corruption > 50 || chaos > 60) return "red";
  if (chaos > 40) return "grey";
  if (corruption < 20 && chaos < 20) return "golden";
  return "grey";
}

function getWorldAge(chapter: number): string {
  const ages = [
    "Era do Primeiro Véu",
    "Era das Escolhas",
    "Era do Eclipse",
    "Era do Colapso",
    "Era do Julgamento Final",
  ];
  return ages[chapter - 1] ?? ages[ages.length - 1];
}

// ────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ────────────────────────────────────────────────────────────
function clamp(v: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, v));
}

function computeAlignment(faith: number, corruption: number): AlignmentPath {
  if (corruption > 60) return "shadow";
  if (faith > 60 && corruption < 20) return "light";
  return "neutral";
}

function computeAppearance(corruption: number, faith: number): ChroniclePlayer["appearance"] {
  if (corruption > 70) return "corrupted";
  if (corruption > 40) return "marked";
  if (faith > 80) return "divine";
  return "pure";
}

function getTitle(playerClass: PlayerClass, faith: number, corruption: number): string {
  if (corruption > 70) return "O Caído";
  if (corruption > 40) return "O Marcado";
  if (faith > 85) return "O Abençoado";
  if (faith > 60) return "O Fiel";
  const titles: Record<PlayerClass, string> = {
    sacred_warrior: "Guerreiro do Véu",
    prophet: "Voz do Deserto",
    priest: "Servo de Zion",
    desert_hunter: "Sombra das Areias",
    oracle: "Olho Aberto",
    corrupted: "Portador da Sombra",
  };
  return titles[playerClass];
}

export function getAlignmentColor(alignment: AlignmentPath): string {
  return alignment === "light" ? "amber" : alignment === "shadow" ? "red" : "gray";
}

export function getAppearanceEmoji(appearance: ChroniclePlayer["appearance"]): string {
  return { pure: "✨", marked: "🔶", corrupted: "🩸", divine: "👑" }[appearance];
}

export function getSkyEmoji(sky: WorldState["skyColor"]): string {
  return { golden: "🌅", red: "🔴", grey: "🌫️", black: "🌑", white: "☀️" }[sky];
}

export function getPendingChoices(state: ChronicleGameState): NarrativeChoice[] {
  return state.availableChoices.filter((c) => !c.isResolved && c.chapter <= state.chapter);
}

export function getActivePropheciesForPlayer(state: ChronicleGameState): Prophecy[] {
  return state.activeProphecies.filter((p) => p.chapter <= state.chapter + 1);
}
