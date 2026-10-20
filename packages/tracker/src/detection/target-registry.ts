import { findProjects } from "./projects";
import { findSections } from "./sections";
import type { TrackedElement } from "./tracked-element";

export interface TargetRegistry {
  refresh(): TrackedElement[];
  projectContaining(element: Element): string | undefined;
}

export function createTargetRegistry(root: ParentNode): TargetRegistry {
  const known: TrackedElement[] = [];
  const isKnown = (candidate: TrackedElement) =>
    known.some((target) => target.element === candidate.element && target.kind === candidate.kind);

  return {
    refresh() {
      const discovered = [...findSections(root), ...findProjects(root)].filter((target) => !isKnown(target));
      known.push(...discovered);
      return discovered;
    },

    projectContaining(element) {
      return known.find((target) => target.kind === "project" && target.element.contains(element))?.target;
    },
  };
}
