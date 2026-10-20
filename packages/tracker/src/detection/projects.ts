import { repositoryOf } from "./repository";
import type { TrackedElement } from "./tracked-element";

const headingSelector = "h2, h3, h4, h5";

export function findProjects(root: ParentNode): TrackedElement[] {
  const marked = [...root.querySelectorAll("[data-project]")];
  return marked.length > 0 ? marked.map(markedProject).filter(hasTarget) : detectProjects(root);
}

function markedProject(element: Element): TrackedElement {
  return { element, kind: "project", target: (element.getAttribute("data-project") ?? "").trim() };
}

function detectProjects(root: ParentNode): TrackedElement[] {
  const cards = new Map<Element, string>();

  for (const link of root.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    if (repositoryOf(link.href) === null) continue;

    const card = projectCardAround(link);
    if (card !== null && !cards.has(card)) cards.set(card, projectName(card));
  }

  return [...cards].map(([element, target]): TrackedElement => ({ element, kind: "project", target }));
}

function projectCardAround(link: Element): Element | null {
  const body = link.ownerDocument.body;

  for (
    let element = link.parentElement;
    element !== null && element !== body;
    element = element.parentElement
  ) {
    if (element.querySelector(headingSelector) !== null) {
      return repositoriesIn(element).size === 1 ? element : null;
    }
  }

  return null;
}

function repositoriesIn(element: Element): Set<string> {
  const links = [...element.querySelectorAll<HTMLAnchorElement>("a[href]")];
  return new Set(links.map((link) => repositoryOf(link.href)).filter((repository) => repository !== null));
}

function projectName(card: Element): string {
  return (card.querySelector(headingSelector)?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function hasTarget(project: TrackedElement): boolean {
  return project.target !== "";
}
