import { prefersReducedMotion } from "./motion";

interface Dot {
  radius: number;
  angle: number;
  phase: number;
  speed: number;
  wobble: number;
  size: number;
  delay: number;
  offsetX: number;
  offsetY: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
  scatterX: number;
  scatterY: number;
}

const maxPixelRatio = 2;
const scatterSeconds = 0.7;
const gatherSeconds = 1.1;
const touchReturnMs = 4000;
const lineShades = 4;

export function scatterDotOrbs(): void {
  document.querySelectorAll<HTMLCanvasElement>("canvas[data-orb]").forEach((canvas) => {
    const area = canvas.parentElement;
    const ring = area?.querySelector<HTMLElement>("[data-orb-ring]");
    if (area && ring) startOrb(canvas, area, ring, Number(canvas.dataset.orbScale ?? 1));
  });
}

function startOrb(canvas: HTMLCanvasElement, area: HTMLElement, ring: HTMLElement, scale: number): void {
  const context = canvas.getContext("2d");
  if (!context) return;

  const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
  const dots: Dot[] = [];
  const pointer = { x: -9999, y: -9999 };
  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let orbRadius = 0;
  let spread = 0;
  let spreadTarget = 0;
  let gatherAt = 0;
  let visible = false;
  let frame = 0;
  const startedAt = performance.now();
  let previous = startedAt;

  const pickScatterTargets = () => {
    for (const dot of dots) {
      dot.scatterX = 0.04 + Math.random() * 0.92;
      dot.scatterY = 0.06 + Math.random() * 0.88;
    }
  };

  const measure = () => {
    const box = canvas.getBoundingClientRect();
    const ringBox = ring.getBoundingClientRect();
    if (!box.width || !ringBox.width) return;
    const firstTime = width === 0;
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    centerX = ringBox.left - box.left + ringBox.width / 2;
    centerY = ringBox.top - box.top + ringBox.height / 2;
    orbRadius = Math.max(ringBox.width, ringBox.height) * 0.44 * scale;
    if (!firstTime) return;

    const count = orbRadius < 160 ? 120 : 170;
    for (let index = 0; index < count; index++) {
      const onEdge = index < count / 3;
      dots.push({
        radius: onEdge ? 0.93 + Math.random() * 0.07 : Math.sqrt(Math.random()) * 0.88,
        angle: onEdge
          ? (index / (count / 3)) * Math.PI * 2 + Math.random() * 0.08
          : Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.7,
        wobble: onEdge ? 0.008 + Math.random() * 0.01 : 0.015 + Math.random() * 0.025,
        size: 1.4 + Math.random() * 1.4,
        delay: Math.random(),
        offsetX: (Math.random() - 0.5) * orbRadius * 2,
        offsetY: (Math.random() - 0.5) * orbRadius * 2,
        velocityX: 0,
        velocityY: 0,
        x: 0,
        y: 0,
        scatterX: 0.5,
        scatterY: 0.5,
      });
    }
    pickScatterTargets();
  };

  const smooth = (value: number) => value * value * (3 - 2 * value);

  const draw = (now: number) => {
    const seconds = (now - startedAt) / 1000;
    const delta = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    spread += Math.max(-delta / gatherSeconds, Math.min(delta / scatterSeconds, spreadTarget - spread));
    if (gatherAt && now > gatherAt) {
      spreadTarget = 0;
      gatherAt = 0;
    }

    const spin = seconds * 0.06;
    const pushRadius = Math.max(orbRadius * 0.3, 60);
    const pushRadiusSquared = pushRadius * pushRadius;
    for (const dot of dots) {
      const angle = dot.angle + spin;
      let homeX =
        centerX +
        Math.cos(angle) * dot.radius * orbRadius +
        Math.cos(seconds * dot.speed + dot.phase) * dot.wobble * orbRadius;
      let homeY =
        centerY +
        Math.sin(angle) * dot.radius * orbRadius +
        Math.sin(seconds * dot.speed * 1.3 + dot.phase) * dot.wobble * orbRadius;
      if (spread > 0.001) {
        const progress = smooth(Math.max(0, Math.min(1, spread * 1.5 - dot.delay * 0.5)));
        const targetX = dot.scatterX * width + Math.cos(seconds * dot.speed * 0.6 + dot.phase) * 14;
        const targetY = dot.scatterY * height + Math.sin(seconds * dot.speed * 0.8 + dot.phase) * 14;
        homeX += (targetX - homeX) * progress;
        homeY += (targetY - homeY) * progress;
      }
      const dx = homeX + dot.offsetX - pointer.x;
      const dy = homeY + dot.offsetY - pointer.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < pushRadiusSquared && distanceSquared > 0.01) {
        const distance = Math.sqrt(distanceSquared);
        const force = (1 - distance / pushRadius) ** 2 * 2.6;
        dot.velocityX += (dx / distance) * force;
        dot.velocityY += (dy / distance) * force;
      }
      dot.velocityX = (dot.velocityX - dot.offsetX * 0.035) * 0.88;
      dot.velocityY = (dot.velocityY - dot.offsetY * 0.035) * 0.88;
      dot.offsetX += dot.velocityX;
      dot.offsetY += dot.velocityY;
      dot.x = homeX + dot.offsetX;
      dot.y = homeY + dot.offsetY;
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const reach = orbRadius * 0.24 * (1 + smooth(spread) * 1.3);
    const reachSquared = reach * reach;
    const shades: Dot[][] = Array.from({ length: lineShades }, () => []);
    for (let a = 0; a < dots.length; a++) {
      const first = dots[a] as Dot;
      for (let b = a + 1; b < dots.length; b++) {
        const second = dots[b] as Dot;
        const ex = first.x - second.x;
        const ey = first.y - second.y;
        const gapSquared = ex * ex + ey * ey;
        if (gapSquared < reachSquared) {
          shades[Math.min(lineShades - 1, Math.floor((Math.sqrt(gapSquared) / reach) * lineShades))]?.push(
            first,
            second,
          );
        }
      }
    }
    context.lineWidth = 0.8;
    shades.forEach((pairs, shade) => {
      if (pairs.length === 0) return;
      context.strokeStyle = `rgba(17, 17, 22, ${0.42 - shade * 0.1})`;
      context.beginPath();
      for (let index = 0; index < pairs.length; index += 2) {
        const from = pairs[index] as Dot;
        const to = pairs[index + 1] as Dot;
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
      }
      context.stroke();
    });
    context.fillStyle = "#111116";
    context.beginPath();
    for (const dot of dots) {
      context.moveTo(dot.x + dot.size, dot.y);
      context.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
    }
    context.fill();
  };

  const loop = (now: number) => {
    draw(now);
    frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  };
  const start = () => {
    if (frame || !visible || document.hidden) return;
    previous = performance.now();
    frame = requestAnimationFrame(loop);
  };

  measure();
  if (prefersReducedMotion()) {
    for (const dot of dots) {
      dot.offsetX = 0;
      dot.offsetY = 0;
    }
    draw(startedAt);
    new ResizeObserver(() => {
      measure();
      draw(startedAt);
    }).observe(canvas);
    return;
  }

  const insideOrb = () => {
    const dx = pointer.x - centerX;
    const dy = pointer.y - centerY;
    return dx * dx + dy * dy < orbRadius * orbRadius;
  };
  const scatter = () => {
    if (spreadTarget === 0 && spread < 0.05) pickScatterTargets();
    spreadTarget = 1;
  };
  const track = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
  };
  const release = () => {
    pointer.x = -9999;
    pointer.y = -9999;
  };

  area.addEventListener(
    "pointermove",
    (event) => {
      track(event);
      if (event.pointerType === "mouse" && insideOrb()) scatter();
    },
    { passive: true },
  );
  area.addEventListener(
    "pointerdown",
    (event) => {
      track(event);
      if (event.pointerType !== "mouse" && insideOrb()) {
        scatter();
        gatherAt = performance.now() + touchReturnMs;
      }
    },
    { passive: true },
  );
  area.addEventListener("pointerleave", () => {
    release();
    spreadTarget = 0;
  });
  area.addEventListener("pointercancel", release);
  area.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "mouse") release();
  });
  new ResizeObserver(measure).observe(canvas);
  void document.fonts.ready.then(measure);
  document.addEventListener("visibilitychange", start);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      start();
    }).observe(area);
  } else {
    visible = true;
    start();
  }
}
