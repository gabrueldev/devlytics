import type { CollectPayload } from "@devlytics/shared";

export function sendPayload(endpoint: string, payload: CollectPayload): void {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon?.(endpoint, body)) return;

  fetch(endpoint, { method: "POST", body, keepalive: true, mode: "no-cors" }).catch(() => undefined);
}
