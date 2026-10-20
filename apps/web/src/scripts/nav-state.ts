const scrolledAfterPx = 12;

export function trackNavScroll(): void {
  const nav = document.querySelector("[data-nav]");
  if (nav === null) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    nav.classList.toggle("is-scrolled", window.scrollY > scrolledAfterPx);
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}
