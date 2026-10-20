import type { Dictionary } from "./pt";

export const en: Dictionary = {
  locale: "en",
  meta: {
    title: "Devlytics | Free analytics for developer portfolios",
    description:
      "Find out which projects in your portfolio hold attention, what visitors click and whether the company opened the link you sent. One tag, no cookies, free.",
  },
  skip: "Skip to content",
  nav: {
    label: "Main navigation",
    install: "Install",
    features: "What you see",
    privacy: "Privacy",
    faq: "Questions",
    switchLanguage: "Português",
    switchLanguageLabel: "Ler em português",
    cta: "See the demo",
  },
  hero: {
    badge: "Free and cookieless",
    titleStart: "Your portfolio,",
    titleAccent: "measured by project.",
    sub: "Find out which projects hold attention, what visitors click and whether the company opened the link you sent. One tag, nothing to configure.",
    tagLabel: "Install tag",
    copy: "Copy",
    copied: "Copied!",
    primary: "See real numbers",
    note: "Sign up with GitHub opens soon. Collection already runs on the author's portfolio.",
    previewProjects: ["Online store", "Finance app", "Realtime chat"],
    previewAttention: "Attention now",
  },
  install: {
    title: "One tag. That's it.",
    sub: "Paste it before </head> and publish. Devlytics reads the page and finds what matters in a portfolio on its own.",
    found: "What it found on the page",
    groups: [
      { name: "Sections", items: ["#about", "#projects", "#contact"] },
      { name: "Projects", items: ["Online store", "Finance app"] },
      { name: "Conversions", items: ["GitHub", "PDF résumé", "LinkedIn", "Email"] },
    ],
    steps: ["Sign in with GitHub", "Enter your portfolio domain", "Paste the tag and publish"],
    worksWith: "Works with plain HTML, React, Next, Vite, Astro and WordPress.",
    optionalStart: "Want another name for a project? Use",
    optionalEnd: "It's optional.",
  },
  features: {
    title: "Built for portfolios, not stores.",
    sub: "Regular tools count pages. Devlytics counts projects.",
    cards: [
      {
        id: "ranking",
        title: "Project ranking",
        text: "Which projects get seen, for how long, and how many clicks go to the demo and the code.",
      },
      {
        id: "attention",
        title: "Attention map",
        text: "How long each section stayed on screen, only while the tab is really open. And how far people scroll.",
      },
      {
        id: "conversions",
        title: "Ready-made conversions",
        text: "Résumé downloads, GitHub, LinkedIn, email and WhatsApp, without setting up a single event.",
      },
      {
        id: "links",
        title: "Tracked links",
        text: "Sent your portfolio to a job opening? Add ?ref=stripe and know when they opened it and what they saw.",
      },
    ],
    ranking: [
      { name: "Online store", value: "1m 42s" },
      { name: "Finance app", value: "58s" },
      { name: "Realtime chat", value: "31s" },
    ],
    sections: ["Hero", "About", "Projects", "Contact"],
    conversions: ["GitHub", "Résumé", "LinkedIn", "Email"],
    notification: {
      app: "Devlytics",
      time: "now",
      title: "Your Stripe link was opened",
      text: "Saw 3 projects, stayed 4 min and clicked GitHub.",
    },
  },
  demo: {
    title: "The author's real numbers",
    sub: "gabrueldev.com has used Devlytics since October 20, 2026. This is what it sees right now.",
    metrics: {
      visits: "Visits in the last 7 days",
      attention: "Average attention per visit",
      topProject: "Most engaging project",
      repoClicks: "Repository clicks",
    },
    loading: "Loading…",
    unavailable: "The first numbers are still coming in. Check back soon.",
    visit: "Visit the portfolio",
  },
  privacy: {
    title: "No cookies. No IP. No banner.",
    sub: "Nothing is stored in the visitor's browser. To count unique visitors, the server mixes a few details with a salt that changes every day and keeps only the result.",
    inputs: ["IP 203.0.113.7", "Chrome · macOS", "fulano.dev", "Today's salt"],
    output: "Stored",
    caption:
      "The IP is used only for the math and then discarded. Tomorrow the same visitor becomes a different code, never linked to another portfolio.",
    points: [
      "Honors Do Not Track and Global Privacy Control",
      "Ignores bots and your own machine",
      "Aggregated numbers only, nothing that identifies a person",
    ],
  },
  free: {
    title: "Free. For real.",
    sub: "No paid plan, no hidden limit, no credit card. Built by a developer, for developers.",
    byStart: "Built by",
    author: "Gabriel Rodrigues",
  },
  faq: {
    title: "Questions",
    items: [
      {
        question: "Do I need to mark up my HTML?",
        answer:
          "No. Sections and projects are found automatically. The data-project, data-section and data-track attributes are there only if you want to fine-tune.",
      },
      {
        question: "Will it slow my site down?",
        answer: "The script is under 3 KB, loads with defer and is served from Cloudflare's edge.",
      },
      {
        question: "Does it work with React, Next or Astro?",
        answer: "Yes. It's one tag in the <head>, and it follows single-page app navigation.",
      },
      {
        question: "Do I need a cookie banner because of it?",
        answer: "No. It uses no cookies and stores no personal data about visitors.",
      },
      {
        question: "How much does it cost?",
        answer: "Nothing. Not now, not later.",
      },
    ],
  },
  footer: {
    rights: "Gabriel Rodrigues",
    portfolio: "Author's portfolio",
    privacy: "Privacy",
  },
};
