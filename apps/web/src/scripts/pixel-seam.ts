import { prefersReducedMotion } from "./motion";

interface Pixel {
  x: number;
  y: number;
  color: string;
  floor: number;
  phase: number;
  speed: number;
}

const pixelSize = 10;
const frameGapMs = 50;
const maxPixelRatio = 2;

export function twinklePixelSeams(): void {
  document.querySelectorAll<HTMLCanvasElement>("canvas[data-pixel-seam]").forEach(startSeam);
}

function startSeam(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  if (!context) return;

  const from = brandColor("--brand", [47, 91, 255]);
  const to = brandColor("--brand-deep", [28, 63, 217]);
  let pixels: Pixel[] = [];
  let width = 0;
  let height = 0;
  let visible = false;
  let frame = 0;
  let lastDrawn = 0;

  const build = () => {
    const box = canvas.getBoundingClientRect();
    if (!box.width) return;
    const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const rows = Math.floor(height / pixelSize);
    const columns = Math.ceil(width / pixelSize);
    pixels = [];
    for (let row = 0; row < rows; row++) {
      const fromSeam = rows - 1 - row;
      const chance = 0.5 * (1 - fromSeam / rows) ** 1.8;
      for (let column = 0; column < columns; column++) {
        if (Math.random() > chance) continue;
        const mix = 0.5 + 0.5 * (column / columns);
        pixels.push({
          x: column * pixelSize,
          y: row * pixelSize,
          color: `rgb(${from.map((channel, index) => Math.round(channel + ((to[index] ?? channel) - channel) * mix)).join(",")})`,
          floor: fromSeam === 0 ? 0.55 : 0.1,
          phase: Math.random() * Math.PI * 2,
          speed: (Math.PI * 2) / (3 + Math.random() * 5),
        });
      }
    }
  };

  const draw = (now: number) => {
    const seconds = now / 1000;
    context.clearRect(0, 0, width, height);
    for (const pixel of pixels) {
      const wave = 0.5 + 0.5 * Math.sin(seconds * pixel.speed + pixel.phase);
      context.globalAlpha = pixel.floor + (1 - pixel.floor) * wave * wave;
      context.fillStyle = pixel.color;
      context.fillRect(pixel.x, pixel.y, pixelSize, pixelSize);
    }
    context.globalAlpha = 1;
  };

  const loop = (now: number) => {
    if (now - lastDrawn > frameGapMs) {
      lastDrawn = now;
      draw(now);
    }
    frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  };
  const start = () => {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(loop);
  };

  build();
  window.addEventListener("resize", () => {
    build();
    draw(performance.now());
  });
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    draw(0);
    return;
  }
  document.addEventListener("visibilitychange", start);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    start();
  }).observe(canvas);
}

function brandColor(token: string, fallback: number[]): number[] {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  return match ? match.slice(1, 4).map((hex) => parseInt(hex, 16)) : fallback;
}
