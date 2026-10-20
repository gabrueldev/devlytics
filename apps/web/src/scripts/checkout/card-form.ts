import type { CardFields } from "./cakto-sdk";

export function cardFieldsOf(form: HTMLFormElement): CardFields | null {
  const data = new FormData(form);
  const digits = (name: string) => String(data.get(name) ?? "").replace(/\D/g, "");
  const [month = "", year = ""] = String(data.get("cardExpiry") ?? "")
    .split(/\D+/)
    .filter(Boolean);

  const card: CardFields = {
    holderName: String(data.get("cardName") ?? "").trim(),
    cardNumber: digits("cardNumber"),
    cvv: digits("cardCvv"),
    expMonth: month.padStart(2, "0"),
    expYear: year,
  };

  const valid =
    card.holderName.length >= 3 &&
    /^\d{13,19}$/.test(card.cardNumber) &&
    /^\d{3,4}$/.test(card.cvv) &&
    /^(0[1-9]|1[0-2])$/.test(card.expMonth) &&
    /^(\d{2}|\d{4})$/.test(card.expYear);

  return valid ? card : null;
}
