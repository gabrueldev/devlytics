const encoder = new TextEncoder();
const separator = ".";

export interface SessionClaims {
  userId: string;
  expiresAt: Date;
}

export class SessionTokens {
  constructor(private readonly secret: string) {}

  async issue(claims: SessionClaims): Promise<string> {
    const payload = `${encodeURIComponent(claims.userId)}${separator}${claims.expiresAt.getTime()}`;
    const signature = await crypto.subtle.sign("HMAC", await this.key(), encoder.encode(payload));
    return `${payload}${separator}${toBase64Url(new Uint8Array(signature))}`;
  }

  async verify(token: string, now: Date): Promise<SessionClaims | null> {
    const parts = token.split(separator);
    if (parts.length !== 3) return null;

    const [userId = "", expiresAt = "", signature = ""] = parts;
    const signatureBytes = fromBase64Url(signature);
    if (signatureBytes === null) return null;

    const payload = encoder.encode(`${userId}${separator}${expiresAt}`);
    if (!(await crypto.subtle.verify("HMAC", await this.key(), signatureBytes, payload))) return null;

    const expiry = new Date(Number(expiresAt));
    if (Number.isNaN(expiry.getTime()) || expiry <= now) return null;

    return { userId: decodeURIComponent(userId), expiresAt: expiry };
  }

  private key(): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      encoder.encode(this.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}
