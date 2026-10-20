import { prefersReducedMotion, whenVisible } from "./motion";

const typingMs = 1700;
const detectionDelayMs = 350;

export function typeInstallTag(): void {
  const section = document.querySelector<HTMLElement>("[data-install]");
  const target = section?.querySelector<HTMLElement>("[data-typewriter]");
  if (!section || !target) return;

  const text = target.dataset.typewriter ?? "";
  const finish = () => {
    target.textContent = text;
    section.classList.remove("is-typing");
    section.classList.add("is-found");
  };

  if (prefersReducedMotion()) {
    finish();
    return;
  }

  target.textContent = "";
  whenVisible(section.querySelector(".install-editor") ?? section, () => {
    section.classList.add("is-typing");
    const start = performance.now();

    const frame = (now: number) => {
      const progress = Math.min(1, (now - start) / typingMs);
      target.textContent = text.slice(0, Math.round(progress * text.length));

      if (progress < 1) requestAnimationFrame(frame);
      else setTimeout(finish, detectionDelayMs);
    };
    requestAnimationFrame(frame);
  });
}
