const maxClockSkewSeconds = 5 * 60;
const encoder = new TextEncoder();

export interface SignedDelivery {
  body: string;
  timestamp: string | null;
  signature: string | null;
}

export async function isSignedByCakto(delivery: SignedDelivery, secret: string, now: Date): Promise<boolean> {
  const { body, timestamp, signature } = delivery;
  if (timestamp === null || signature === null || !signature.startsWith("v1=")) return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(now.getTime() / 1000 - sentAt) > maxClockSkewSeconds) return false;

  const expected = await hmacHex(secret, `${timestamp}.${body}`);
  return sameText(expected, signature.slice(3).toLowerCase());
}

export function sameText(left: string, right: string): boolean {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b);
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
