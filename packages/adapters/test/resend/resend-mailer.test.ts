import { describe, expect, it } from "vitest";
import { ResendMailer } from "../../src";

describe("ResendMailer", () => {
  it("sends the message from the configured address", async () => {
    let sent: { headers: Headers; body: unknown } | null = null;
    const mailer = new ResendMailer("re_key", "Devlytics <avisos@gabrueldev.com>", async (_input, init) => {
      sent = { headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) };
      return Response.json({ id: "email_1" });
    });

    await mailer.send({ to: "fulano@dev.com", subject: "Oi", text: "texto", html: "<p>texto</p>" });

    expect(sent).toEqual({
      headers: expect.any(Headers),
      body: {
        from: "Devlytics <avisos@gabrueldev.com>",
        to: ["fulano@dev.com"],
        subject: "Oi",
        text: "texto",
        html: "<p>texto</p>",
      },
    });
  });

  it("fails loudly when Resend refuses the message", async () => {
    const mailer = new ResendMailer(
      "re_key",
      "x@y.z",
      async () => new Response("domain not verified", { status: 403 }),
    );

    await expect(mailer.send({ to: "a@b.c", subject: "s", text: "t", html: "h" })).rejects.toThrow("403");
  });
});
