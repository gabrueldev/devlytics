const feedbackMs = 1800;

export function enableTagCopy(): void {
  document.querySelectorAll<HTMLElement>("[data-copy-tag]").forEach((container) => {
    const button = container.querySelector<HTMLButtonElement>("[data-copy-value]");
    const label = container.querySelector("[data-copy-label]");
    if (button === null || label === null) return;

    const idleText = label.textContent ?? "";
    let reset: ReturnType<typeof setTimeout> | undefined;

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copyValue ?? "");
      } catch {
        return;
      }

      container.classList.add("is-copied");
      label.textContent = container.dataset.copiedLabel ?? idleText;
      clearTimeout(reset);
      reset = setTimeout(() => {
        container.classList.remove("is-copied");
        label.textContent = idleText;
      }, feedbackMs);
    });
  });
}
