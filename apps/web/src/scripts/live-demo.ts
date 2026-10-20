interface DemoOverview {
  visits: number;
  averageAttentionMs: number;
  topProject: string | null;
  repoClicks: number;
}

const endpoint = "https://devlytics.gabrueldev.com/api/demo";

export async function loadLiveDemo(): Promise<void> {
  const panel = document.querySelector<HTMLElement>("[data-live-demo]");
  if (panel === null) return;

  const overview = await fetchOverview();
  if (overview === null) {
    showUnavailable(panel);
    return;
  }

  const locale = panel.dataset.locale ?? "pt-BR";
  const numbers = new Intl.NumberFormat(locale);
  const values: Record<string, string> = {
    visits: numbers.format(overview.visits),
    attention: formatDuration(overview.averageAttentionMs),
    topProject: overview.topProject ?? "—",
    repoClicks: numbers.format(overview.repoClicks),
  };

  panel.querySelectorAll<HTMLElement>("[data-metric]").forEach((metric) => {
    const key = metric.dataset.metric ?? "";
    metric.textContent = values[key] ?? "—";
    metric.classList.toggle("is-text", key === "topProject");
  });
}

async function fetchOverview(): Promise<DemoOverview | null> {
  try {
    const response = await fetch(endpoint, { headers: { accept: "application/json" } });
    if (!response.ok) return null;
    return (await response.json()) as DemoOverview;
  } catch {
    return null;
  }
}

function showUnavailable(panel: HTMLElement): void {
  panel.querySelectorAll("[data-metric]").forEach((metric) => {
    metric.textContent = "—";
  });

  const status = panel.querySelector<HTMLElement>("[data-demo-status]");
  if (status === null) return;
  status.textContent = panel.dataset.unavailable ?? "";
  status.hidden = false;
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds.toString().padStart(2, "0")}s` : `${seconds}s`;
}
