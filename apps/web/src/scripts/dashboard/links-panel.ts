import type { Dictionary } from "../../i18n";
import { DashboardApiError, type DashboardApi, type LinkVisit, type TrackedLink } from "./dashboard-api";
import type { Formatter } from "./formatting";

type Texts = Dictionary["dashboard"];
const copiedFeedbackMs = 1600;
const disarmAfterMs = 5000;

export class LinksPanel {
  private site: { id: string; domain: string } | null = null;
  private links: TrackedLink[] = [];
  private openLinkId: string | null = null;

  constructor(
    private readonly elements: { form: HTMLFormElement; error: HTMLElement; list: HTMLElement },
    private readonly api: DashboardApi,
    private readonly texts: Texts,
    private readonly format: Formatter,
  ) {
    elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.create();
    });
  }

  async show(site: { id: string; domain: string }, openLinkId: string | null = null): Promise<void> {
    this.site = site;
    this.openLinkId = openLinkId;
    this.links = [];
    this.render();
    try {
      const links = await this.api.links(site.id);
      if (this.site?.id !== site.id) return;
      this.links = links;
      this.render();
    } catch {
      this.showError(this.texts.links.failed);
    }
  }

  private async create(): Promise<void> {
    if (!this.site) return;
    const input = this.elements.form.querySelector<HTMLInputElement>("input[name=label]");
    const label = input?.value.trim() ?? "";
    if (!label) return this.showError(this.texts.links.invalid);

    this.showError(null);
    try {
      const link = await this.api.addLink(this.site.id, label);
      this.links = [link, ...this.links];
      this.elements.form.reset();
      this.render();
    } catch (error) {
      const code = error instanceof DashboardApiError ? error.code : "";
      this.showError(
        code === "invalid_link"
          ? this.texts.links.invalid
          : code === "link_taken"
            ? this.texts.links.taken
            : this.texts.links.failed,
      );
    }
  }

  private render(): void {
    const t = this.texts.links;
    if (this.links.length === 0) {
      const empty = document.createElement("li");
      empty.className = "bar-empty";
      empty.textContent = t.empty;
      this.elements.list.replaceChildren(empty);
      return;
    }
    this.elements.list.replaceChildren(...this.links.map((link) => this.itemFor(link)));
  }

  private itemFor(link: TrackedLink): HTMLLIElement {
    const t = this.texts.links;
    const url = `https://${this.site?.domain ?? ""}/?ref=${link.slug}`;
    const item = node("li", "link-item glass-plate") as HTMLLIElement;
    const head = node("div", "link-head");

    const toggle = node("button", "link-toggle") as HTMLButtonElement;
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    const status = node("span", `link-status${link.firstOpenedAt ? " is-opened" : ""}`);
    status.textContent = link.firstOpenedAt
      ? t.opened.replace("{date}", this.format.moment(link.firstOpenedAt))
      : t.notOpened;
    toggle.append(text("span", "link-label", link.label), status);

    const urlBox = node("span", "link-url");
    const copy = node("button", "link-copy") as HTMLButtonElement;
    copy.type = "button";
    copy.textContent = t.copy;
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        return;
      }
      copy.textContent = t.copied;
      setTimeout(() => (copy.textContent = t.copy), copiedFeedbackMs);
    });
    urlBox.append(text("code", "", url), copy);

    const remove = node("button", "link-remove") as HTMLButtonElement;
    remove.type = "button";
    remove.textContent = t.remove;
    let disarm: ReturnType<typeof setTimeout> | undefined;
    remove.addEventListener("click", async () => {
      if (!remove.classList.contains("is-armed")) {
        remove.classList.add("is-armed");
        remove.textContent = t.removeConfirm;
        disarm = setTimeout(() => {
          remove.classList.remove("is-armed");
          remove.textContent = t.remove;
        }, disarmAfterMs);
        return;
      }
      clearTimeout(disarm);
      if (!this.site) return;
      await this.api.removeLink(this.site.id, link.id);
      this.links = this.links.filter((entry) => entry.id !== link.id);
      this.render();
    });

    head.append(toggle, urlBox, remove);
    const timeline = node("div", "link-timeline");
    timeline.hidden = true;
    item.append(head, timeline);

    const open = () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      timeline.hidden = expanded;
      if (!expanded) void this.loadTimeline(link, timeline);
    };
    toggle.addEventListener("click", open);
    if (link.id === this.openLinkId) {
      this.openLinkId = null;
      queueMicrotask(() => {
        open();
        item.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }
    return item;
  }

  private async loadTimeline(link: TrackedLink, container: HTMLElement): Promise<void> {
    const t = this.texts.links;
    container.replaceChildren(text("h3", "", t.timeline), text("p", "visit-empty", t.loadingTimeline));
    if (!this.site) return;
    try {
      const { visits } = await this.api.timeline(this.site.id, link.id);
      const body =
        visits.length === 0
          ? [text("p", "visit-empty", t.noVisits)]
          : visits.map((visit) => this.visitCard(visit));
      container.replaceChildren(text("h3", "", t.timeline), ...body);
    } catch {
      container.replaceChildren(text("h3", "", t.timeline), text("p", "visit-empty", t.timelineError));
    }
  }

  private visitCard(visit: LinkVisit): HTMLElement {
    const t = this.texts.links;
    const names = this.texts.conversions.names as Record<string, string>;
    const card = node("article", "visit");
    const stayedMs = Date.parse(visit.lastSeenAt) - Date.parse(visit.openedAt) || visit.attentionMs;
    const where = [
      this.format.country(visit.country ?? "") ?? this.texts.countries.unknown,
      [visit.device, visit.browser].filter(Boolean).join(" · "),
      t.stayed.replace("{time}", this.format.duration(stayedMs)),
    ].join(" · ");

    card.append(text("p", "visit-when", this.format.moment(visit.openedAt)), text("p", "visit-meta", where));

    card.append(text("p", "visit-meta", t.projectsSeen));
    card.append(
      visit.projects.length === 0
        ? text("p", "visit-empty", t.noProjects)
        : chips(
            visit.projects.map((project) => `${project.name} · ${this.format.duration(project.attentionMs)}`),
          ),
    );

    card.append(text("p", "visit-meta", t.clicked));
    card.append(
      visit.clicks.length === 0
        ? text("p", "visit-empty", t.noClicks)
        : chips(
            visit.clicks.map((click) =>
              [names[click.action] ?? click.action, click.project].filter(Boolean).join(" · "),
            ),
          ),
    );
    return card;
  }

  private showError(message: string | null): void {
    this.elements.error.hidden = message === null;
    this.elements.error.textContent = message ?? "";
  }
}

function chips(labels: string[]): HTMLElement {
  const list = node("div", "visit-chips");
  list.append(...labels.map((label) => text("span", "visit-chip", label)));
  return list;
}

function node(tag: string, className: string): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function text(tag: string, className: string, content: string): HTMLElement {
  const element = node(tag, className);
  element.textContent = content;
  return element;
}
