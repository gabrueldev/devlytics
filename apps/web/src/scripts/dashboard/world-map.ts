import type { Formatter } from "./formatting";
import { countryCenters, landGrid } from "./world-map-data";

export interface CountryVisits {
  code: string;
  visits: number;
}

const svgNs = "http://www.w3.org/2000/svg";
const landDotRadius = 0.34;
const minBubbleRadius = 1.1;
const bubbleRadiusRange = 3.4;
const minHitRadius = 2.4;
const pulsingBubbles = 3;

let landPath: string | null = null;

export function renderWorldMap(
  container: HTMLElement,
  countries: CountryVisits[],
  format: Formatter,
  texts: { label: string; tip: string },
): void {
  const { columns, rows } = landGrid;
  const svg = element("svg", { viewBox: `0 0 ${columns} ${rows}`, role: "img" });
  svg.setAttribute("aria-label", texts.label);
  svg.append(element("path", { class: "map-land", d: landDots() }));

  const tip = document.createElement("div");
  tip.className = "chart-tip";
  tip.hidden = true;

  const placed = countries
    .map((country) => ({ ...country, center: countryCenters[country.code] }))
    .filter((country) => country.center !== undefined && country.visits > 0)
    .sort((first, second) => second.visits - first.visits);
  const max = Math.max(1, ...placed.map((country) => country.visits));

  placed.forEach((country, index) => {
    const [longitude, latitude] = country.center ?? [0, 0];
    const x = (longitude + 180) / landGrid.degreesPerCell;
    const y = (landGrid.northEdge - latitude) / landGrid.degreesPerCell;
    const radius = minBubbleRadius + Math.sqrt(country.visits / max) * bubbleRadiusRange;
    const name = format.country(country.code) ?? country.code;

    const group = element("g", { class: "map-place" });
    group.style.setProperty("--delay", `${index * 60}ms`);
    if (index < pulsingBubbles)
      group.append(element("circle", { class: "map-pulse", cx: x, cy: y, r: radius }));
    group.append(
      element("circle", { class: "map-bubble", cx: x, cy: y, r: radius }),
      element("circle", {
        class: "hit",
        cx: x,
        cy: y,
        r: Math.max(radius, minHitRadius),
        fill: "transparent",
      }),
    );
    group.addEventListener("pointerenter", () => {
      tip.textContent = texts.tip.replace("{country}", name).replace("{count}", format.count(country.visits));
      tip.style.left = `${(x / columns) * 100}%`;
      tip.style.top = `${((y - radius) / rows) * 100}%`;
      tip.hidden = false;
      group.classList.add("is-active");
    });
    group.addEventListener("pointerleave", () => {
      tip.hidden = true;
      group.classList.remove("is-active");
    });
    svg.append(group);
  });

  container.replaceChildren(svg, tip);
}

function landDots(): string {
  if (landPath !== null) return landPath;
  const parts: string[] = [];
  const r = landDotRadius;
  landGrid.hexRows.forEach((hexRow, row) => {
    for (let column = 0; column < landGrid.columns; column++) {
      const nibble = parseInt(hexRow[column >> 2] ?? "0", 16);
      if ((nibble >> (3 - (column & 3))) & 1) {
        const x = column + 0.5 - r;
        const y = row + 0.5;
        parts.push(`M${x.toFixed(2)} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`);
      }
    }
  });
  landPath = parts.join("");
  return landPath;
}

function element(name: string, attributes: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(svgNs, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}
