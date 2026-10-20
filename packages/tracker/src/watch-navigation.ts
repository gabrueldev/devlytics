export function watchNavigation(onNavigate: () => void) {
  const pushState = history.pushState.bind(history);

  history.pushState = (...args: Parameters<History["pushState"]>) => {
    pushState(...args);
    onNavigate();
  };

  window.addEventListener("popstate", onNavigate);
}
