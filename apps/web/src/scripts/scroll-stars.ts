import { prefersReducedMotion } from "./motion";

interface Star {
  x: number;
  y: number;
  r: number;
  stiffness: number;
  damping: number;
  stretch: number;
  stretchSpeed: number;
  lag: number;
  lagSpeed: number;
}

const maxPixelRatio = 2;
const resizeDelayMs = 150;

export function stretchStarsOnScroll(): void {
  document.querySelectorAll<HTMLCanvasElement>("canvas[data-stars]").forEach(startStarField);
}

function startStarField(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  const area = canvas.parentElement;
  if (!context || !area) return;

  const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
  let width = 0;
  let height = 0;
  let stars: Star[] = [];
  let lastScrollY = window.scrollY;
  let velocity = 0;
  let running = false;
  let inView = false;

  const build = () => {
    const box = area.getBoundingClientRect();
    width = box.width;
    height = box.height;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    stars = scatter(width, height);
    draw();
  };

  const draw = () => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(17, 17, 22, 0.7)";
    for (const star of stars) {
      const stretch = 1 + star.stretch;
      const scaleY = Math.max(0.55, stretch);
      const scaleX = 1 / Math.max(0.7, Math.sqrt(Math.max(0.3, stretch)));
      const reach = star.r * 2.4;
      context.setTransform(ratio * scaleX, 0, 0, ratio * scaleY, ratio * star.x, ratio * (star.y + star.lag));
      context.beginPath();
      context.moveTo(0, -reach);
      context.quadraticCurveTo(0, 0, reach, 0);
      context.quadraticCurveTo(0, 0, 0, reach);
      context.quadraticCurveTo(0, 0, -reach, 0);
      context.quadraticCurveTo(0, 0, 0, -reach);
      context.fill();
    }
  };

  const step = () => {
    if (!inView) {
      running = false;
      return;
    }
    const y = window.scrollY;
    velocity += (y - lastScrollY - velocity) * 0.35;
    lastScrollY = y;
    const stretchTarget = Math.min(4, Math.abs(velocity) * 0.09);
    const lagTarget = Math.max(-26, Math.min(26, -velocity * 0.9));
    let moving = Math.abs(velocity) > 0.05;
    for (const star of stars) {
      star.stretchSpeed =
        (star.stretchSpeed + (stretchTarget - star.stretch) * star.stiffness) * star.damping;
      star.stretch += star.stretchSpeed;
      star.lagSpeed = (star.lagSpeed + (lagTarget - star.lag) * star.stiffness) * star.damping;
      star.lag += star.lagSpeed;
      if (
        Math.abs(star.stretchSpeed) > 0.002 ||
        Math.abs(star.stretch) > 0.002 ||
        Math.abs(star.lagSpeed) > 0.02 ||
        Math.abs(star.lag) > 0.05
      ) {
        moving = true;
      }
    }
    draw();
    if (moving) requestAnimationFrame(step);
    else running = false;
  };

  const wake = () => {
    if (running || !inView) return;
    running = true;
    requestAnimationFrame(step);
  };

  build();
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, resizeDelayMs);
  });
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;

  window.addEventListener("scroll", wake, { passive: true });
  new IntersectionObserver(
    ([entry]) => {
      inView = entry?.isIntersecting ?? false;
      lastScrollY = window.scrollY;
      wake();
    },
    { rootMargin: "120px" },
  ).observe(area);
}

function scatter(width: number, height: number): Star[] {
  const cell = width < 640 ? 74 : 96;
  let seed = 7;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const stars: Star[] = [];
  for (let y = cell / 2; y < height; y += cell) {
    for (let x = cell / 2; x < width; x += cell) {
      if (random() < 0.35) continue;
      stars.push({
        x: x + (random() - 0.5) * cell * 0.7,
        y: y + (random() - 0.5) * cell * 0.7,
        r: 1.6 + random() * 2.8,
        stiffness: 0.1 + random() * 0.08,
        damping: 0.8 + random() * 0.06,
        stretch: 0,
        stretchSpeed: 0,
        lag: 0,
        lagSpeed: 0,
      });
    }
  }
  return stars;
}
