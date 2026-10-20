export function glidePillAcrossNav(): void {
  const nav = document.querySelector<HTMLElement>("[data-nav]");
  const links = nav?.querySelector<HTMLElement>(".nav-links");
  const cta = nav?.querySelector<HTMLAnchorElement>(".nav-cta");
  const inner = cta?.closest<HTMLElement>(".nav-inner");
  if (!nav || !links || !cta || !inner) return;

  const pill = document.createElement("span");
  pill.className = "nav-pill";
  pill.setAttribute("aria-hidden", "true");
  inner.prepend(pill);
  nav.classList.add("has-pill");

  let home: HTMLElement = cta;

  const moveTo = (target: HTMLElement, instant = false) => {
    let x = 0;
    let y = 0;
    for (
      let node: HTMLElement | null = target;
      node && node !== inner;
      node = node.offsetParent as HTMLElement | null
    ) {
      x += node.offsetLeft;
      y += node.offsetTop;
    }
    if (instant) pill.style.transition = "none";
    pill.style.width = `${target.offsetWidth}px`;
    pill.style.height = `${target.offsetHeight}px`;
    pill.style.transform = `translate(${x}px, ${y}px)`;
    if (instant) {
      void pill.offsetWidth;
      pill.style.transition = "";
    }
  };
  const goHome = () => moveTo(home);
  const placeHome = () => moveTo(home, true);

  links.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    link.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") moveTo(link);
    });
    link.addEventListener("focus", () => moveTo(link));
    link.addEventListener("blur", goHome);
    link.addEventListener("click", () => {
      home = link;
    });
  });
  cta.addEventListener("focus", () => moveTo(cta));
  links.addEventListener("pointerleave", goHome);

  void document.fonts.ready.then(placeHome);
  window.addEventListener("resize", placeHome, { passive: true });
  placeHome();
}
