import type { FunnelStep, Ranked } from "./dashboard-api";
import type { Formatter } from "./formatting";

export interface FunnelTexts {
  stages: Record<FunnelStep["stage"], { name: string; hint: string }>;
  ofTotal: string;
  dropped: string;
  empty: string;
  label: string;
}

const svgNs = "http://www.w3.org/2000/svg";
const viewWidth = 400;
const bandHeight = 56;
const neckHeight = 14;
const minShare = 0.08;
const breakdownStages: Partial<Record<FunnelStep["stage"], readonly string[]>> = {
  openedProject: ["repo", "demo"],
  contacted: ["email", "whatsapp", "linkedin", "cv"],
};

export function renderFunnel(
  container: HTMLElement,
  funnel: FunnelStep[],
  conversions: Ranked[],
  actionNames: Record<string, string>,
  texts: FunnelTexts,
  format: Formatter,
): void {
  const total = funnel[0]?.sessions ?? 0;
  if (total === 0) {
    container.replaceChildren(textNode("p", "bar-empty", texts.empty));
    return;
  }

  const share = (sessions: number) => Math.max(minShare, sessions / total);
  const svg = svgNode("svg", {
    viewBox: `0 0 ${viewWidth} ${funnel.length * bandHeight}`,
    preserveAspectRatio: "none",
    role: "img",
    class: "funnel-shape",
  });
  svg.setAttribute(
    "aria-label",
    `${texts.label}: ${funnel.map((step) => `${texts.stages[step.stage].name} ${step.sessions}`).join(", ")}`,
  );

  const defs = svgNode("defs", {});
  const gradient = svgNode("linearGradient", {
    id: "funnel-fill",
    gradientUnits: "userSpaceOnUse",
    x1: 0,
    y1: 0,
    x2: 0,
    y2: funnel.length * bandHeight,
  });
  gradient.append(
    svgNode("stop", { offset: "0%", class: "funnel-stop-top" }),
    svgNode("stop", { offset: "100%", class: "funnel-stop-bottom" }),
  );
  defs.append(gradient);
  svg.append(defs);

  const labels = document.createElement("ol");
  labels.className = "funnel-labels";

  funnel.forEach((step, index) => {
    const top = index * bandHeight;
    const width = share(step.sessions) * viewWidth;
    const nextWidth = share(funnel[index + 1]?.sessions ?? step.sessions) * viewWidth;
    const bottom = top + bandHeight - (index < funnel.length - 1 ? neckHeight : 0);
    const band = svgNode("path", {
      class: "funnel-band",
      d: bandPath(width, nextWidth, top, bottom, top + bandHeight),
      fill: "url(#funnel-fill)",
    });
    band.style.setProperty("--delay", `${index * 90}ms`);
    svg.append(band);

    const previous = funnel[index - 1]?.sessions ?? 0;
    const item = document.createElement("li");
    item.style.setProperty("--delay", `${index * 90}ms`);
    const head = document.createElement("p");
    head.className = "funnel-head";
    head.append(
      textNode("span", "funnel-name", texts.stages[step.stage].name),
      textNode("strong", "funnel-count", format.count(step.sessions)),
    );
    const meta = document.createElement("p");
    meta.className = "funnel-meta";
    meta.append(textNode("span", "", detailOf(step, conversions, actionNames, texts, format)));
    if (index > 0) {
      meta.append(
        textNode("span", "funnel-share", texts.ofTotal.replace("{percent}", percent(step.sessions, total))),
      );
      if (previous > step.sessions) {
        meta.append(
          textNode(
            "span",
            "funnel-drop",
            texts.dropped.replace("{percent}", percent(previous - step.sessions, previous)),
          ),
        );
      }
    }
    item.append(head, meta);
    labels.append(item);
  });

  const shape = document.createElement("div");
  shape.className = "funnel-figure";
  shape.append(svg);
  container.replaceChildren(shape, labels);
}

export function renderJourneyTrail(
  container: HTMLElement,
  funnel: FunnelStep[],
  texts: FunnelTexts,
  format: Formatter,
): void {
  const visits = funnel[0]?.sessions ?? 0;
  const trail = document.createElement("ol");
  trail.className = "journey-trail";
  trail.setAttribute(
    "aria-label",
    `${texts.label}: ${funnel.map((step) => `${texts.stages[step.stage].name} ${step.sessions}`).join(", ")}`,
  );
  funnel.forEach((step) => {
    const item = document.createElement("li");
    item.className = step.sessions > 0 ? "is-reached" : "";
    const dot = textNode(
      "span",
      "journey-dot",
      visits > 1 && step.sessions > 0 ? format.count(step.sessions) : "",
    );
    dot.setAttribute("aria-hidden", "true");
    item.append(dot, textNode("span", "journey-name", texts.stages[step.stage].name));
    trail.append(item);
  });
  container.replaceChildren(trail);
}

function detailOf(
  step: FunnelStep,
  conversions: Ranked[],
  actionNames: Record<string, string>,
  texts: FunnelTexts,
  format: Formatter,
): string {
  const actions = breakdownStages[step.stage];
  const clicked = actions ? conversions.filter((row) => actions.includes(row.name) && row.value > 0) : [];
  if (clicked.length === 0) return texts.stages[step.stage].hint;
  return clicked.map((row) => `${actionNames[row.name] ?? row.name} ${format.count(row.value)}`).join(" · ");
}

function bandPath(width: number, nextWidth: number, top: number, bottom: number, next: number): string {
  const center = viewWidth / 2;
  const left = center - width / 2;
  const right = center + width / 2;
  const nextLeft = center - nextWidth / 2;
  const nextRight = center + nextWidth / 2;
  const curve = (next - bottom) / 2;
  if (next === bottom) return `M${left},${top}H${right}V${bottom}H${left}Z`;
  return [
    `M${left},${top}`,
    `H${right}`,
    `V${bottom}`,
    `C${right},${bottom + curve} ${nextRight},${next - curve} ${nextRight},${next}`,
    `H${nextLeft}`,
    `C${nextLeft},${next - curve} ${left},${bottom + curve} ${left},${bottom}`,
    "Z",
  ].join("");
}

function percent(part: number, whole: number): string {
  return whole === 0 ? "0" : String(Math.round((part / whole) * 100));
}

function svgNode(name: string, attributes: Record<string, string | number>): SVGElement {
  const element = document.createElementNS(svgNs, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

function textNode(tag: string, className: string, content: string): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = content;
  return element;
}
