export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function whenVisible(element: Element, onVisible: () => void, threshold = 0.35): void {
  if (!("IntersectionObserver" in window)) {
    onVisible();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        onVisible();
      }
    },
    { threshold },
  );
  observer.observe(element);
}
