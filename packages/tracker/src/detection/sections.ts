import type { TrackedElement } from "./tracked-element";

export function findSections(root: ParentNode): TrackedElement[] {
  return [...root.querySelectorAll("[data-section], section[id]")]
    .map((element): TrackedElement => ({
      element,
      kind: "section",
      target: (element.getAttribute("data-section") || element.id).trim(),
    }))
    .filter((section) => section.target !== "");
}
