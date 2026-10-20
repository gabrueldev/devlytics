import type { Formatter } from "./formatting";

const svgNs = "http://www.w3.org/2000/svg";
const fallbackWidth = 720;
const minWidth = 280;
const height = 200;
const minLabelSpacing = 72;
const padding = { top: 12, right: 4, bottom: 24, left: 32 };
const dayMs = 24 * 60 * 60 * 1000;

export function fillDays(daily: { day: string; visits: number }[], since: string, until: string) {
  const visitsByDay = new Map(daily.map((entry) => [entry.day, entry.visits]));
  const days: { day: string; visits: number }[] = [];
  const last = new Date(until.slice(0, 10)).getTime();
  for (let time = new Date(since.slice(0, 10)).getTime() + dayMs; time <= last; time += dayMs) {
    const day = new Date(time).toISOString().slice(0, 10);
    days.push({ day, visits: visitsByDay.get(day) ?? 0 });
  }
  return days;
}

export function renderDailyChart(
  container: HTMLElement,
  days: { day: string; visits: number }[],
  format: Formatter,
  tipTemplate: string,
): void {
  const width = Math.max(minWidth, Math.round(container.clientWidth) || fallbackWidth);
  const max = Math.max(1, ...days.map((entry) => entry.visits));
  const top = niceCeiling(max);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const slot = plotWidth / days.length;
  const barWidth = Math.max(2, Math.min(28, slot - 2));
  const y = (value: number) => padding.top + plotHeight - (value / top) * plotHeight;

  const svg = element("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });
  svg.setAttribute("aria-label", days.map((entry) => `${format.day(entry.day)}: ${entry.visits}`).join(", "));

  for (const value of [0, top / 2, top]) {
    svg.append(
      element("line", {
        class: "grid-line",
        x1: padding.left,
        x2: width - padding.right,
        y1: y(value),
        y2: y(value),
      }),
    );
    const label = element("text", {
      class: "axis-label",
      x: padding.left - 8,
      y: y(value) + 4,
      "text-anchor": "end",
    });
    label.textContent = format.count(value);
    svg.append(label);
  }

  const tip = document.createElement("div");
  tip.className = "chart-tip";
  tip.hidden = true;

  const labelEvery = Math.ceil(days.length / Math.max(2, Math.floor(plotWidth / minLabelSpacing)));
  days.forEach((entry, index) => {
    const center = padding.left + slot * index + slot / 2;
    const barHeight = Math.max(entry.visits > 0 ? 2 : 0, plotHeight - (y(entry.visits) - padding.top));
    const hit = element("rect", {
      class: "hit",
      x: center - slot / 2,
      y: padding.top,
      width: slot,
      height: plotHeight,
      fill: "transparent",
    });
    const bar = element("path", {
      class: "bar",
      d: roundedTop(center - barWidth / 2, y(0) - barHeight, barWidth, barHeight),
    });

    hit.addEventListener("pointerenter", () => {
      tip.textContent = tipTemplate
        .replace("{count}", format.count(entry.visits))
        .replace("{day}", format.day(entry.day));
      tip.style.left = `${(center / width) * 100}%`;
      tip.style.top = `${(y(entry.visits) / height) * 100}%`;
      tip.hidden = false;
    });
    hit.addEventListener("pointerleave", () => (tip.hidden = true));
    svg.append(hit, bar);

    if (index % labelEvery === 0) {
      const label = element("text", {
        class: "axis-label",
        x: center,
        y: height - 6,
        "text-anchor": "middle",
      });
      label.textContent = format.day(entry.day);
      svg.append(label);
    }
  });

  container.replaceChildren(svg, tip);
}

function roundedTop(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function niceCeiling(value: number): number {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 3, 4, 5, 6, 8, 10].find(
    (candidate) => candidate * magnitude >= value && (magnitude > 1 || candidate % 2 === 0),
  );
  return (step ?? 10) * magnitude;
}

function element(name: string, attributes: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(svgNs, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}
