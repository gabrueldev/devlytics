const sessionIdLength = 32;
const encoder = new TextEncoder();

export interface VisitorFingerprint {
  domain: string;
  ip: string;
  userAgent: string;
}

export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function dailySalt(seed: string, day: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(seed),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(day)));
}

export async function anonymousSessionId(
  seed: string,
  at: Date,
  visitor: VisitorFingerprint,
): Promise<string> {
  const salt = await dailySalt(seed, utcDay(at));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode([salt, visitor.domain, visitor.ip, visitor.userAgent].join("\n")),
  );
  return toHex(digest).slice(0, sessionIdLength);
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
