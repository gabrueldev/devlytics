import type { Dictionary } from "../../i18n";
import {
  DashboardApi,
  SignedOutError,
  type Account,
  type SiteReport,
  type SiteSummary,
} from "./dashboard-api";
import { fillDays, renderDailyChart } from "./daily-chart";
import { Formatter } from "./formatting";
import { mountNewSiteForm } from "./new-site-form";
import { renderProjectsTable } from "./projects-table";
import { renderRankedList, type RankedRow } from "./ranked-list";

type View = "loading" | "signed-out" | "onboarding" | "report";
type Texts = Dictionary["dashboard"];

const periods = [7, 30, 90];
const lastSiteKey = "devlytics-dashboard-site";
const disarmAfterMs = 3000;

const root = document.querySelector<HTMLElement>("[data-dashboard]");
if (root !== null) void startDashboard(root);

async function startDashboard(root: HTMLElement): Promise<void> {
  const texts = JSON.parse(root.dataset.texts ?? "{}") as Texts;
  const format = new Formatter(root.dataset.locale ?? "en");
  const api = new DashboardApi();
  const find = <Found extends Element = HTMLElement>(selector: string) => required<Found>(root, selector);

  const siteSelect = find<HTMLSelectElement>("[data-site-select]");
  const dialog = find<HTMLDialogElement>("[data-new-site-dialog]");
  const template = find<HTMLTemplateElement>("[data-new-site-template]");
  const body = find("[data-report-body]");
  const install = find("[data-install]");
  const reportError = find("[data-report-error]");
  const removeButton = find<HTMLButtonElement>("[data-remove-site]");

  const params = new URLSearchParams(location.search);
  let account: Account | null = null;
  let siteId: string | null = params.get("site") ?? storedSite();
  let days = periods.includes(Number(params.get("days"))) ? Number(params.get("days")) : 7;
  let loadingReport = 0;
  let drawChart: (() => void) | null = null;

  find("[data-login-failed]").hidden = params.get("login") !== "failed";

  const show = (view: View) => {
    root.dataset.view = view;
    root.querySelectorAll<HTMLElement>("[data-view-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.viewPanel !== view;
    });
    find("[data-account]").hidden = view === "loading" || view === "signed-out";
  };

  const remember = () => {
    const url = new URL(location.href);
    url.searchParams.delete("login");
    if (siteId) url.searchParams.set("site", siteId);
    url.searchParams.set("days", String(days));
    history.replaceState(null, "", url);
    try {
      if (siteId) localStorage.setItem(lastSiteKey, siteId);
    } catch {
      return;
    }
  };

  const renderSites = (sites: SiteSummary[]) => {
    siteSelect.replaceChildren(
      ...sites.map((site) => {
        const option = new Option(
          site.name === site.domain ? site.domain : `${site.name} · ${site.domain}`,
          site.id,
        );
        option.selected = site.id === siteId;
        return option;
      }),
    );
  };

  const renderReport = (report: SiteReport) => {
    find("[data-site-name]").textContent = report.site.name;
    const domain = find<HTMLAnchorElement>("[data-site-domain]");
    domain.textContent = report.site.domain;
    domain.href = `https://${report.site.domain}`;

    install.hidden = report.visits > 0;
    const repoClicks = report.conversions.find((row) => row.name === "repo")?.value ?? 0;
    find("[data-kpi=visits]").textContent = format.count(report.visits);
    find("[data-kpi=attention]").textContent = report.visits
      ? format.duration(report.averageAttentionMs)
      : "–";
    find("[data-kpi=topProject]").textContent = report.projects[0]?.name ?? "–";
    find("[data-kpi=repoClicks]").textContent = format.count(repoClicks);

    drawChart = () =>
      renderDailyChart(
        find("[data-daily-chart]"),
        fillDays(report.daily, report.period.since, report.period.until),
        format,
        texts.visitsOn,
      );
    drawChart?.();
    renderProjectsTable(find("[data-projects]"), report.projects, texts.projects, format);

    const names = texts.conversions.names as Record<string, string>;
    const ranked = (key: string, rows: RankedRow[], empty: string) =>
      renderRankedList(find(`[data-ranked=${key}]`), rows, empty);

    ranked(
      "sections",
      report.sections.map((row) => ({
        name: row.name,
        value: row.value,
        display: format.duration(row.value),
      })),
      texts.sections.empty,
    );
    ranked(
      "conversions",
      report.conversions.map((row) => ({
        name: names[row.name] ?? row.name,
        value: row.value,
        display: format.count(row.value),
      })),
      texts.conversions.empty,
    );
    ranked(
      "sources",
      report.sources.map((row) => ({
        name: row.name || texts.sources.direct,
        value: row.value,
        display: format.count(row.value),
      })),
      texts.sources.empty,
    );
    ranked(
      "countries",
      report.countries.map((row) => ({
        name: format.country(row.name) ?? texts.countries.unknown,
        value: row.value,
        display: format.count(row.value),
      })),
      texts.countries.empty,
    );
  };

  const loadReport = async () => {
    if (!siteId) return;
    const ticket = ++loadingReport;
    root.querySelectorAll<HTMLButtonElement>("[data-period]").forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.period) === days));
    });
    const site = account?.sites.find((entry) => entry.id === siteId);
    if (site) {
      find("[data-site-name]").textContent = site.name;
      find("[data-site-domain]").textContent = site.domain;
    }
    body.classList.add("is-loading");
    reportError.hidden = true;
    remember();

    try {
      const report = await api.report(siteId, days);
      if (ticket !== loadingReport) return;
      renderReport(report);
    } catch (error) {
      if (error instanceof SignedOutError) return show("signed-out");
      if (ticket === loadingReport) reportError.hidden = false;
    } finally {
      if (ticket === loadingReport) body.classList.remove("is-loading");
    }
  };

  const enterAccount = (next: Account) => {
    account = next;
    const avatar = find<HTMLImageElement>("[data-avatar]");
    avatar.hidden = !next.user.avatarUrl;
    if (next.user.avatarUrl) avatar.src = next.user.avatarUrl;
    avatar.alt = next.user.login ?? next.user.name ?? "";

    if (next.sites.length === 0) {
      siteId = null;
      show("onboarding");
      return;
    }
    if (!next.sites.some((site) => site.id === siteId)) siteId = next.sites[0]?.id ?? null;
    renderSites(next.sites);
    show("report");
    void loadReport();
  };

  const onSiteAdded = (site: SiteSummary) => {
    dialog.close();
    if (!account) return;
    siteId = site.id;
    enterAccount({ ...account, sites: [...account.sites, site] });
  };

  mountNewSiteForm(find('[data-new-site-slot="onboarding"]'), template, api, texts.newSite, {
    onAdded: onSiteAdded,
  });
  mountNewSiteForm(find('[data-new-site-slot="dialog"]'), template, api, texts.newSite, {
    onAdded: onSiteAdded,
    onCancel: () => dialog.close(),
  });

  find("[data-open-new-site]").addEventListener("click", () => {
    dialog.showModal();
    dialog.querySelector<HTMLInputElement>("input[name=domain]")?.focus();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  siteSelect.addEventListener("change", () => {
    siteId = siteSelect.value;
    void loadReport();
  });

  root.querySelectorAll<HTMLButtonElement>("[data-period]").forEach((button) => {
    button.addEventListener("click", () => {
      days = Number(button.dataset.period);
      void loadReport();
    });
  });

  let resizeFrame = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => drawChart?.());
  }).observe(find("[data-daily-chart]"));

  find("[data-retry]").addEventListener("click", () => void loadReport());

  let disarm: ReturnType<typeof setTimeout> | undefined;
  removeButton.addEventListener("click", async () => {
    if (!removeButton.classList.contains("is-armed")) {
      removeButton.classList.add("is-armed");
      removeButton.textContent = texts.removeConfirm;
      disarm = setTimeout(() => {
        removeButton.classList.remove("is-armed");
        removeButton.textContent = texts.remove;
      }, disarmAfterMs);
      return;
    }

    clearTimeout(disarm);
    removeButton.classList.remove("is-armed");
    removeButton.textContent = texts.remove;
    if (!siteId || !account) return;
    await api.removeSite(siteId);
    const removed = siteId;
    siteId = null;
    enterAccount({ ...account, sites: account.sites.filter((site) => site.id !== removed) });
  });

  find("[data-sign-out]").addEventListener("click", async () => {
    await api.signOut().catch(() => undefined);
    account = null;
    show("signed-out");
  });

  try {
    enterAccount(await api.account());
  } catch {
    show("signed-out");
  }
}

function storedSite(): string | null {
  try {
    return localStorage.getItem(lastSiteKey);
  } catch {
    return null;
  }
}

function required<Found extends Element = HTMLElement>(scope: ParentNode, selector: string): Found {
  const element = scope.querySelector<Found>(selector);
  if (element === null) throw new Error(`Dashboard markup is missing ${selector}`);
  return element;
}
