import { prefersReducedMotion, whenVisible } from "./motion";

export function revealOnScroll(): void {
  const elements = document.querySelectorAll(".reveal");

  if (prefersReducedMotion()) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  elements.forEach((element) => whenVisible(element, () => element.classList.add("is-visible"), 0.18));
}
