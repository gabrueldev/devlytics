export interface RankedRow {
  name: string;
  value: number;
  display: string;
}

export function renderRankedList(list: HTMLElement, rows: RankedRow[], emptyText: string): void {
  if (rows.length === 0) {
    const empty = document.createElement("li");
    empty.className = "bar-empty";
    empty.textContent = emptyText;
    list.replaceChildren(empty);
    return;
  }

  const max = Math.max(...rows.map((row) => row.value), 1);
  list.replaceChildren(
    ...rows.map((row) => {
      const item = document.createElement("li");
      const name = textSpan("bar-name", row.name);
      name.title = row.name;
      const track = document.createElement("span");
      track.className = "bar-track";
      const fill = document.createElement("span");
      fill.className = "bar-fill";
      fill.style.display = "block";
      fill.style.width = `${Math.max(2, (row.value / max) * 100)}%`;
      track.append(fill);
      item.append(name, textSpan("bar-value", row.display), track);
      return item;
    }),
  );
}

function textSpan(className: string, text: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}
