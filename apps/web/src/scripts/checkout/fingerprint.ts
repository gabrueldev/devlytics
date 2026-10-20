const storageKey = "devlytics-checkout-fingerprint";

export function checkoutFingerprint(): string {
  try {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) return saved;
    const created = crypto.randomUUID();
    sessionStorage.setItem(storageKey, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}
