import type { ProjectStats } from "./dashboard-api";
import type { Formatter } from "./formatting";

export interface ProjectColumns {
  name: string;
  visitors: string;
  attention: string;
  repo: string;
  demo: string;
  empty: string;
}

export function renderProjectsTable(
  container: HTMLElement,
  projects: ProjectStats[],
  columns: ProjectColumns,
  format: Formatter,
): void {
  if (projects.length === 0) {
    const empty = document.createElement("p");
    empty.className = "table-empty";
    empty.textContent = columns.empty;
    container.replaceChildren(empty);
    return;
  }

  const table = document.createElement("table");
  const head = table.createTHead().insertRow();
  for (const label of [columns.name, columns.visitors, columns.attention, columns.repo, columns.demo]) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = label;
    head.append(cell);
  }

  const body = table.createTBody();
  for (const project of projects) {
    const row = body.insertRow();
    for (const value of [
      project.name,
      format.count(project.visitors),
      format.duration(project.attentionMs),
      format.count(project.repoClicks),
      format.count(project.demoClicks),
    ]) {
      row.insertCell().textContent = value;
    }
  }

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  wrap.append(table);
  container.replaceChildren(wrap);
}
