import { prefersReducedMotion } from "./motion";

type Sprite = string[];
type Palette = Record<string, string>;

interface Twinkle {
  column: number;
  row: number;
  color: string;
  floor: number;
  phase: number;
  speed: number;
}

interface Flyer {
  kind: "butterfly" | "bee";
  x: number;
  baseY: number;
  y: number;
  heading: number;
  speed: number;
  phase: number;
  wingColor: string;
}

const frameGapMs = 33;
const maxPixelRatio = 2;
const grassGreens = ["#2e7d32", "#388e3c", "#43a047", "#4caf50", "#66bb6a"];
const petalColors = ["#e53935", "#fdd835", "#f5f5f5", "#ec407a", "#ab47bc", "#ff7043"];
const butterflyWings = ["#ff9800", "#42a5f5", "#fdd835", "#ec407a"];

const tree: Sprite = [
  "....LGG....",
  "..GLGGGGG..",
  ".GGGGGgGGG.",
  "GGgGLGGGGGG",
  "GGGGGGgGLGG",
  ".GGgGGGGGG.",
  "GGGGGGGGgGG",
  ".GGGGgGGGG.",
  "..GGGGGGG..",
  "....TTT....",
  "....TTT....",
  "....TTt....",
  "...TTTTT...",
];
const treePalette: Palette = { G: "#2e7d32", g: "#1b5e20", L: "#81c784", T: "#6d4c2f", t: "#4e342e" };

const daisy: Sprite = [".P.", "PYP", ".P.", ".s.", "ss.", ".s."];
const tulip: Sprite = ["P.P", "PPP", ".P.", ".s.", ".ss", ".s."];
const flowerShapes = [daisy, tulip];

const butterflyFrames: Sprite[] = [
  ["W.b.W", "WWbWW", ".WbW."],
  [".WbW.", ".WbW.", "..b.."],
];
const beeFrames: Sprite[] = [
  [".ww..", "YKYKY", ".KYK."],
  ["..w..", "YKYKY", ".KYK."],
];

export function growPixelGardens(): void {
  document.querySelectorAll<HTMLCanvasElement>("canvas[data-pixel-garden]").forEach(startGarden);
  document.querySelectorAll<HTMLCanvasElement>("canvas[data-pixel-soil]").forEach(paintSoil);
}

function startGarden(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  if (!context) return;

  const scenery = document.createElement("canvas");
  const sceneryContext = scenery.getContext("2d");
  if (!sceneryContext) return;

  let pixel = 5;
  let ratio = 1;
  let width = 0;
  let height = 0;
  let columns = 0;
  let rows = 0;
  let twinkles: Twinkle[] = [];
  let flyers: Flyer[] = [];
  let visible = false;
  let frame = 0;
  let lastDrawn = 0;

  const build = () => {
    const box = canvas.getBoundingClientRect();
    if (!box.width) return;
    ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    width = box.width;
    height = box.height;
    pixel = width < 640 ? 4 : 5;
    columns = Math.ceil(width / pixel);
    rows = Math.floor(height / pixel);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    scenery.width = canvas.width;
    scenery.height = canvas.height;
    sceneryContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    sceneryContext.clearRect(0, 0, width, height);

    const ground = rows - 2;
    for (let column = 0; column < columns; column++) {
      const blade = Math.floor(Math.random() * 5);
      for (let row = ground - blade; row < rows; row++) {
        sceneryContext.fillStyle = pick(grassGreens);
        sceneryContext.fillRect(column * pixel, row * pixel, pixel, pixel);
      }
    }

    sceneryContext.fillStyle = grassGreens[1] ?? "#388e3c";
    sceneryContext.fillRect(0, rows * pixel, width, height - rows * pixel);

    const treeColumns = (width < 640 ? [0.78] : [0.06, 0.58, 0.9]).map((share) =>
      Math.round(share * columns),
    );
    for (const column of treeColumns)
      stamp(sceneryContext, tree, treePalette, column, ground - tree.length + 1, pixel);

    const flowerCount = Math.round(columns / 9);
    for (let index = 0; index < flowerCount; index++) {
      const column = Math.floor(Math.random() * (columns - 3));
      if (treeColumns.some((treeColumn) => Math.abs(column - treeColumn - 5) < 8)) continue;
      const shape = pick(flowerShapes);
      const lift = Math.floor(Math.random() * 3);
      stamp(
        sceneryContext,
        shape,
        { P: pick(petalColors), Y: "#fdd835", s: "#2e7d32" },
        column,
        ground - shape.length + 1 - lift,
        pixel,
      );
    }

    twinkles = [];
    const strayRows = Math.min(10, ground - 1);
    for (let distance = 1; distance <= strayRows; distance++) {
      const chance = 0.32 * (1 - distance / strayRows) ** 1.8;
      for (let column = 0; column < columns; column++) {
        if (Math.random() > chance) continue;
        twinkles.push({
          column,
          row: ground - 4 - distance,
          color: pick(grassGreens),
          floor: 0.1,
          phase: Math.random() * Math.PI * 2,
          speed: (Math.PI * 2) / (3 + Math.random() * 5),
        });
      }
    }

    const butterflies = width < 640 ? 2 : 3;
    const bees = width < 640 ? 2 : 3;
    flyers = [
      ...Array.from({ length: butterflies }, () => newFlyer("butterfly")),
      ...Array.from({ length: bees }, () => newFlyer("bee")),
    ];
  };

  const newFlyer = (kind: Flyer["kind"]): Flyer => ({
    kind,
    x: Math.random() * width,
    baseY: height * (kind === "bee" ? 0.45 + Math.random() * 0.25 : 0.2 + Math.random() * 0.35),
    y: 0,
    heading: Math.random() < 0.5 ? -1 : 1,
    speed: kind === "bee" ? 38 + Math.random() * 30 : 16 + Math.random() * 14,
    phase: Math.random() * Math.PI * 2,
    wingColor: pick(butterflyWings),
  });

  const draw = (now: number, still = false) => {
    const seconds = now / 1000;
    const delta = still ? 0 : frameGapMs / 1000;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(scenery, 0, 0);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    for (const twinkle of twinkles) {
      const wave = 0.5 + 0.5 * Math.sin(seconds * twinkle.speed + twinkle.phase);
      context.globalAlpha = twinkle.floor + (1 - twinkle.floor) * wave * wave;
      context.fillStyle = twinkle.color;
      context.fillRect(twinkle.column * pixel, twinkle.row * pixel, pixel, pixel);
    }
    context.globalAlpha = 1;

    for (const flyer of flyers) {
      flyer.x += flyer.heading * flyer.speed * delta;
      if (flyer.x < -20 || flyer.x > width + 20) flyer.heading *= -1;
      if (Math.random() < (flyer.kind === "bee" ? 0.01 : 0.004)) flyer.heading *= -1;
      const flutter =
        flyer.kind === "bee"
          ? Math.sin(seconds * 9 + flyer.phase) * 3
          : Math.sin(seconds * 2.2 + flyer.phase) * 12;
      flyer.y = flyer.baseY + flutter + Math.sin(seconds * 0.7 + flyer.phase) * 8;
      const frames = flyer.kind === "bee" ? beeFrames : butterflyFrames;
      const flap = Math.floor(seconds * (flyer.kind === "bee" ? 14 : 5) + flyer.phase) % 2;
      const palette: Palette =
        flyer.kind === "bee"
          ? { Y: "#fdd835", K: "#212121", w: "#e3f2fd" }
          : { W: flyer.wingColor, b: "#3e2723" };
      const sprite =
        flyer.heading < 0 ? mirror(frames[flap] ?? frames[0] ?? []) : (frames[flap] ?? frames[0] ?? []);
      stamp(context, sprite, palette, Math.round(flyer.x / pixel), Math.round(flyer.y / pixel), pixel);
    }
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
    draw(performance.now(), true);
  });
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    draw(0, true);
    return;
  }
  document.addEventListener("visibilitychange", start);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    start();
  }).observe(canvas);
}

function paintSoil(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  if (!context) return;
  const soils = ["#5d3a1a", "#5d3a1a", "#5d3a1a", "#6b4423", "#4e3016", "#7a4f2a"];

  const paint = () => {
    const box = canvas.getBoundingClientRect();
    if (!box.width) return;
    const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    const pixel = box.width < 640 ? 4 : 5;
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const columns = Math.ceil(box.width / pixel);
    const rows = Math.ceil(box.height / pixel);
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        context.fillStyle = pick(soils);
        context.fillRect(column * pixel, row * pixel, pixel, pixel);
      }
    }
    const stones = Math.round((columns * rows) / 520);
    for (let index = 0; index < stones; index++) {
      const column = Math.floor(Math.random() * columns);
      const row = Math.floor(Math.random() * rows);
      context.fillStyle = pick(["#7a6552", "#3e2a14"]);
      context.fillRect(column * pixel, row * pixel, pixel * 2, pixel);
    }
  };

  paint();
  let timer: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(paint, 150);
  });
}

function stamp(
  context: CanvasRenderingContext2D,
  sprite: Sprite,
  palette: Palette,
  column: number,
  row: number,
  pixel: number,
): void {
  sprite.forEach((line, y) => {
    [...line].forEach((cell, x) => {
      const color = palette[cell];
      if (!color) return;
      context.fillStyle = color;
      context.fillRect((column + x) * pixel, (row + y) * pixel, pixel, pixel);
    });
  });
}

function mirror(sprite: Sprite): Sprite {
  return sprite.map((line) => [...line].reverse().join(""));
}

function pick<Item>(items: Item[]): Item {
  return items[Math.floor(Math.random() * items.length)] as Item;
}
