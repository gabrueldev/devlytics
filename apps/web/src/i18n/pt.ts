export const pt = {
  locale: "pt-BR",
  meta: {
    title: "Devlytics | Analytics grátis para portfólio de dev",
    description:
      "Saiba quais projetos do seu portfólio prendem a atenção, o que as pessoas clicam e se a empresa abriu o link que você mandou. Uma tag, sem cookies, grátis.",
  },
  skip: "Pular para o conteúdo",
  nav: {
    label: "Navegação principal",
    install: "Como instalar",
    features: "O que você vê",
    privacy: "Privacidade",
    faq: "Perguntas",
    switchLanguage: "English",
    switchLanguageLabel: "Read in English",
    cta: "Ver a demo",
  },
  hero: {
    badge: "Grátis e sem cookies",
    titleStart: "Seu portfólio,",
    titleAccent: "medido por projeto.",
    sub: "Saiba quais projetos prendem a atenção, o que as pessoas clicam e se a empresa abriu o link que você mandou. Uma tag, nada para configurar.",
    tagLabel: "Tag de instalação",
    copy: "Copiar",
    copied: "Copiado!",
    primary: "Ver os números reais",
    note: "O cadastro com GitHub abre em breve. A coleta já roda no portfólio do autor.",
    previewProjects: ["Loja virtual", "App de finanças", "Chat em tempo real"],
    previewAttention: "Atenção agora",
  },
  install: {
    title: "Uma tag. Só isso.",
    sub: "Cole antes do </head> e publique. O Devlytics lê a página e encontra sozinho o que importa num portfólio.",
    found: "O que ele encontrou na página",
    groups: [
      { name: "Seções", items: ["#sobre", "#projetos", "#contato"] },
      { name: "Projetos", items: ["Loja virtual", "App de finanças"] },
      { name: "Conversões", items: ["GitHub", "Currículo em PDF", "LinkedIn", "E-mail"] },
    ],
    steps: ["Entre com o GitHub", "Informe o domínio do portfólio", "Cole a tag e publique"],
    worksWith: "Funciona em HTML puro, React, Next, Vite, Astro e WordPress.",
    optionalStart: "Quer dar outro nome a um projeto? Use",
    optionalEnd: "É opcional.",
  },
  features: {
    title: "Feito para portfólio, não para loja.",
    sub: "Ferramentas comuns contam páginas. O Devlytics conta projetos.",
    cards: [
      {
        id: "ranking",
        title: "Ranking de projetos",
        text: "Quais projetos são vistos, por quanto tempo e quantos cliques vão para a demo e para o código.",
      },
      {
        id: "attention",
        title: "Mapa de atenção",
        text: "Quanto tempo cada seção ficou na tela, só com a aba aberta de verdade. E até onde as pessoas rolam.",
      },
      {
        id: "conversions",
        title: "Conversões prontas",
        text: "Currículo baixado, GitHub, LinkedIn, e-mail e WhatsApp, sem configurar nenhum evento.",
      },
      {
        id: "links",
        title: "Links rastreados",
        text: "Mandou o portfólio para uma vaga? Adicione ?ref=nubank e saiba quando abriram e o que viram.",
      },
    ],
    ranking: [
      { name: "Loja virtual", value: "1m 42s" },
      { name: "App de finanças", value: "58s" },
      { name: "Chat em tempo real", value: "31s" },
    ],
    sections: ["Hero", "Sobre", "Projetos", "Contato"],
    conversions: ["GitHub", "Currículo", "LinkedIn", "E-mail"],
    notification: {
      app: "Devlytics",
      time: "agora",
      title: "O link da Nubank foi aberto",
      text: "Viu 3 projetos, ficou 4 min e clicou no GitHub.",
    },
  },
  demo: {
    title: "Os números reais do autor",
    sub: "O gabrueldev.com usa o Devlytics desde 20/10/2026. Isto é o que ele está vendo agora.",
    metrics: {
      visits: "Visitas nos últimos 7 dias",
      attention: "Atenção média por visita",
      topProject: "Projeto que mais prende",
      repoClicks: "Cliques em repositórios",
    },
    loading: "Carregando…",
    unavailable: "Os primeiros dados ainda estão chegando. Volte em breve.",
    visit: "Ver o portfólio",
  },
  privacy: {
    title: "Sem cookies. Sem IP. Sem banner.",
    sub: "Nada fica salvo no navegador de quem visita. Para contar visitantes únicos, o servidor mistura alguns dados com um sal que muda todo dia e guarda só o resultado.",
    inputs: ["IP 203.0.113.7", "Chrome · macOS", "fulano.dev", "Sal de hoje"],
    output: "Guardado",
    caption:
      "O IP serve só para o cálculo e é descartado. Amanhã o mesmo visitante vira outro código, que nunca é ligado a outro portfólio.",
    points: [
      "Respeita Do Not Track e Global Privacy Control",
      "Ignora bots e o seu próprio computador",
      "Só números agregados, nada que identifique alguém",
    ],
  },
  free: {
    title: "Grátis. De verdade.",
    sub: "Sem plano pago, sem limite escondido, sem cartão. Feito por um dev, para devs.",
    byStart: "Feito por",
    author: "Gabriel Rodrigues",
  },
  faq: {
    title: "Perguntas",
    items: [
      {
        question: "Preciso marcar meu HTML?",
        answer:
          "Não. Seções e projetos são encontrados sozinhos. Os atributos data-project, data-section e data-track existem só para quem quiser ajustar.",
      },
      {
        question: "Ele deixa meu site mais lento?",
        answer: "O script tem menos de 3 KB, carrega com defer e é servido da borda da Cloudflare.",
      },
      {
        question: "Funciona com React, Next ou Astro?",
        answer: "Sim. É uma tag no <head>, e ele acompanha a navegação de aplicações de página única.",
      },
      {
        question: "Preciso de aviso de cookies por causa dele?",
        answer: "Não. Ele não usa cookies nem guarda dados pessoais de quem visita.",
      },
      {
        question: "Quanto custa?",
        answer: "Nada. Nem hoje, nem depois.",
      },
    ],
  },
  footer: {
    rights: "Gabriel Rodrigues",
    portfolio: "Portfólio do autor",
    privacy: "Privacidade",
  },
};

export type Dictionary = typeof pt;
