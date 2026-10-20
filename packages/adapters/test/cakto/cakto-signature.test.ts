import { describe, expect, it } from "vitest";
import { isSignedByCakto } from "../../src";

const secret = "s3cret";
const body = JSON.stringify({ event: "purchase_approved" });
const now = new Date("2026-10-20T12:00:00Z");
const timestamp = String(now.getTime() / 1000);

async function sign(message: string, key = secret): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return `v1=${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

describe("isSignedByCakto", () => {
  it("accepts a delivery signed with the shared secret", async () => {
    const signature = await sign(`${timestamp}.${body}`);

    await expect(isSignedByCakto({ body, timestamp, signature }, secret, now)).resolves.toBe(true);
  });

  it("refuses a body changed after signing", async () => {
    const signature = await sign(`${timestamp}.${body}`);

    await expect(isSignedByCakto({ body: `${body} `, timestamp, signature }, secret, now)).resolves.toBe(
      false,
    );
  });

  it("refuses a signature made with another secret", async () => {
    const signature = await sign(`${timestamp}.${body}`, "other");

    await expect(isSignedByCakto({ body, timestamp, signature }, secret, now)).resolves.toBe(false);
  });

  it("refuses replays older than five minutes", async () => {
    const oldTimestamp = String(now.getTime() / 1000 - 301);
    const signature = await sign(`${oldTimestamp}.${body}`);

    await expect(isSignedByCakto({ body, timestamp: oldTimestamp, signature }, secret, now)).resolves.toBe(
      false,
    );
  });

  it("refuses deliveries without signature headers", async () => {
    await expect(isSignedByCakto({ body, timestamp: null, signature: null }, secret, now)).resolves.toBe(
      false,
    );
  });
});
