import { scrollDepths, type ScrollDepth } from "@devlytics/shared/scroll-depths";

export function scrollPercentage(scrollTop: number, viewportHeight: number, documentHeight: number): number {
  if (documentHeight <= viewportHeight) return 100;
  return Math.min(100, ((scrollTop + viewportHeight) / documentHeight) * 100);
}

export function depthsReached(percentage: number, reported: ReadonlySet<ScrollDepth>): ScrollDepth[] {
  return scrollDepths.filter((depth) => percentage >= depth && !reported.has(depth));
}

export function watchScrollDepth(onDepth: (depth: ScrollDepth) => void) {
  const reported = new Set<ScrollDepth>();
  let scheduled = false;

  const measure = () => {
    scheduled = false;
    const root = document.documentElement;
    const percentage = scrollPercentage(window.scrollY, window.innerHeight, root.scrollHeight);

    depthsReached(percentage, reported).forEach((depth) => {
      reported.add(depth);
      onDepth(depth);
    });
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(measure);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  schedule();

  return () => {
    reported.clear();
    schedule();
  };
}
