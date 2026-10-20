import { prefersReducedMotion, whenVisible } from "./motion";

const hexDigits = "0123456789abcdef";
const scrambleMs = 1400;

export function scrambleOnReveal(): void {
  if (prefersReducedMotion()) return;

  document.querySelectorAll<HTMLElement>("[data-scramble]").forEach((element) => {
    const finalText = element.dataset.scramble ?? "";
    const randomDigit = () => hexDigits.charAt(Math.floor(Math.random() * hexDigits.length));
    const lockAt = [...finalText].map(() => 0.25 + Math.random() * 0.75);

    element.textContent = [...finalText].map(randomDigit).join("");

    whenVisible(element, () => {
      const start = performance.now();

      const frame = (now: number) => {
        const progress = Math.min(1, (now - start) / scrambleMs);
        element.textContent = [...finalText]
          .map((digit, index) => (progress >= (lockAt[index] ?? 1) ? digit : randomDigit()))
          .join("");

        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  });
}
