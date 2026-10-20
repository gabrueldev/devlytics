import type { ClickEvent } from "@devlytics/shared";
import { classifyLink } from "../detection/classify-link";
import type { TargetRegistry } from "../detection/target-registry";

const middleButton = 1;

export function clickEventFor(
  element: Element,
  registry: TargetRegistry,
  pageOrigin: string,
): ClickEvent | null {
  const project = registry.projectContaining(element);
  const marked = element.closest("[data-track]")?.getAttribute("data-track")?.trim();
  const link = element.closest<HTMLAnchorElement>("a[href]");
  const action = marked || (link === null ? null : classifyLink(link, project !== undefined, pageOrigin));

  if (!action) return null;
  return project === undefined ? { type: "click", action } : { type: "click", action, project };
}

export function watchClicks(registry: TargetRegistry, onClick: (event: ClickEvent) => void) {
  const handle = (event: MouseEvent) => {
    if (event.type === "auxclick" && event.button !== middleButton) return;
    if (!(event.target instanceof Element)) return;

    const click = clickEventFor(event.target, registry, location.origin);
    if (click !== null) onClick(click);
  };

  document.addEventListener("click", handle, true);
  document.addEventListener("auxclick", handle, true);
}
