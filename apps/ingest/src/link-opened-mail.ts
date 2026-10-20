import type { LinkOpenedMailText } from "@devlytics/core";

export const linkOpenedMail: LinkOpenedMailText = {
  subject: (label) => `O link "${label}" foi aberto · "${label}" was opened`,
  body: (label, domain, timelineUrl) =>
    `Alguém abriu o link "${label}" do ${domain} agora. Veja o que a pessoa viu: ${timelineUrl}\n\nSomeone just opened your "${label}" link on ${domain}.`,
};
