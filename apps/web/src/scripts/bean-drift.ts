import { prefersReducedMotion } from "./motion";

const stiffness = 0.12;
const damping = 0.82;
const maxLagPx = 40;

export function driftBeansOnScroll(): void {
  const section = document.querySelector<HTMLElement>("[data-bean-drift]");
  if (!section || prefersReducedMotion() || !("IntersectionObserver" in window)) return;

  let lastScrollY = window.scrollY;
  let velocity = 0;
  let lag = 0;
  let lagSpeed = 0;
  let running = false;
  let inView = false;

  const step = () => {
    const y = window.scrollY;
    velocity += (y - lastScrollY - velocity) * 0.35;
    lastScrollY = y;
    const target = Math.max(-maxLagPx, Math.min(maxLagPx, velocity * 1.4));
    lagSpeed = (lagSpeed + (target - lag) * stiffness) * damping;
    lag += lagSpeed;
    section.style.setProperty("--lag", `${lag.toFixed(2)}px`);
    if (inView && (Math.abs(velocity) > 0.05 || Math.abs(lagSpeed) > 0.02 || Math.abs(lag) > 0.05)) {
      requestAnimationFrame(step);
    } else {
      running = false;
    }
  };

  const wake = () => {
    if (running || !inView) return;
    running = true;
    requestAnimationFrame(step);
  };

  window.addEventListener("scroll", wake, { passive: true });
  new IntersectionObserver(
    ([entry]) => {
      inView = entry?.isIntersecting ?? false;
      lastScrollY = window.scrollY;
      wake();
    },
    { rootMargin: "200px" },
  ).observe(section);
}
