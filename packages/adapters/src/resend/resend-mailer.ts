import type { Mail, Mailer } from "@devlytics/core";

const sendUrl = "https://api.resend.com/emails";

export class ResendMailer implements Mailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly post: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async send(mail: Mail): Promise<void> {
    const response = await this.post(sendUrl, {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
    });
    if (!response.ok)
      throw new Error(`Resend answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
}

export class DisabledMailer implements Mailer {
  send(): Promise<void> {
    return Promise.resolve();
  }
}
