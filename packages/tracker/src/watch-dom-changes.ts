const settleMs = 800;

export function watchDomChanges(onSettled: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(onSettled, settleMs);
  }).observe(document.body, { childList: true, subtree: true });
}
