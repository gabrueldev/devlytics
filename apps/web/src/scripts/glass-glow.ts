export function followPointerOnGlass(): void {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (document.querySelector("[data-glow]") === null) return;

  document.addEventListener(
    "pointermove",
    (event) => {
      const plate = (event.target as Element).closest?.<HTMLElement>("[data-glow]");
      if (!plate) return;
      const box = plate.getBoundingClientRect();
      plate.style.setProperty("--mx", `${event.clientX - box.left}px`);
      plate.style.setProperty("--my", `${event.clientY - box.top}px`);
      plate.style.setProperty("--glow", "1");
    },
    { passive: true },
  );

  document.addEventListener(
    "pointerout",
    (event) => {
      const plate = (event.target as Element).closest?.<HTMLElement>("[data-glow]");
      if (plate && !plate.contains(event.relatedTarget as Node | null))
        plate.style.setProperty("--glow", "0");
    },
    { passive: true },
  );
}
