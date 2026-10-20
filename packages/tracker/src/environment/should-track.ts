const localHostname = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$|\.(local|localhost|test)$/;

interface PrivacySignals {
  webdriver?: boolean;
  doNotTrack?: string | null;
  globalPrivacyControl?: boolean;
}

export function shouldTrack(
  signals: PrivacySignals,
  location: Pick<Location, "protocol" | "hostname">,
): boolean {
  if (signals.webdriver === true) return false;
  if (signals.doNotTrack === "1" || signals.globalPrivacyControl === true) return false;

  return /^https?:$/.test(location.protocol) && !localHostname.test(location.hostname);
}
