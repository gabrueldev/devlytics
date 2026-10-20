import { isValidCpf } from "@devlytics/shared/cpf";
import { caktoSdkUrl } from "../../config/coffee";
import { loadCaktoSdk } from "./cakto-sdk";
import { cardFieldsOf } from "./card-form";
import { CheckoutApi, CheckoutError } from "./checkout-api";
import { checkoutFingerprint } from "./fingerprint";
import { PixPanel } from "./pix-panel";
import { waitForPayment } from "./wait-for-payment";

type Step = "form" | "pix" | "pending" | "paid";
type ErrorKey = "invalid" | "rejected" | "declined" | "authentication" | "busy" | "unavailable";

const root = document.querySelector<HTMLElement>("[data-checkout]");
if (root !== null) startCheckout(root);

function startCheckout(root: HTMLElement): void {
  const form = required<HTMLFormElement>(root, "form");
  const submit = required<HTMLButtonElement>(form, "button[type=submit]");
  const submitLabel = required<HTMLElement>(submit, "[data-submit-label]");
  const cardFields = required<HTMLElement>(root, "[data-card-fields]");
  const errorBox = required<HTMLElement>(root, "[data-error]");
  const errors = JSON.parse(root.dataset.errors ?? "{}") as Record<ErrorKey, string>;
  const api = new CheckoutApi(root.dataset.api ?? "");
  const sdkClientId = root.dataset.sdkClientId ?? "";
  const amount = Number(root.dataset.amount);
  const fingerprint = checkoutFingerprint();
  const pix = new PixPanel(
    {
      qr: required(root, "[data-pix-qr]"),
      copyButton: required(root, "[data-pix-copy]"),
      copyLabel: required(root, "[data-pix-copy-label]"),
      timer: required(root, "[data-pix-timer]"),
      status: required(root, "[data-pix-status]"),
      expired: required(root, "[data-pix-expired]"),
    },
    { copied: root.dataset.copied ?? "", expiresIn: root.dataset.expiresIn ?? "" },
  );
  let stopWaiting: (() => void) | null = null;

  const method = () => (new FormData(form).get("method") === "card" ? "card" : "pix");

  const showStep = (step: Step) => {
    root.dataset.step = step;
    root.querySelectorAll<HTMLElement>("[data-step-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.stepPanel !== step;
    });
  };

  const showError = (key: ErrorKey | null) => {
    errorBox.hidden = key === null;
    errorBox.textContent = key === null ? "" : errors[key];
  };

  const waitUntilPaid = (orderId: string, until: Date | null) => {
    stopWaiting?.();
    stopWaiting = waitForPayment(
      () => api.isPaid(orderId),
      until,
      () => {
        pix.stopTimer();
        showStep("paid");
      },
      () => pix.expire(),
    );
  };

  const onMethodChange = () => {
    const isCard = method() === "card";
    cardFields.hidden = !isCard;
    cardFields.querySelectorAll("input").forEach((input) => (input.required = isCard));
    submitLabel.textContent = (isCard ? submit.dataset.labelCard : submit.dataset.labelPix) ?? "";
    if (isCard && sdkClientId) void loadCaktoSdk(caktoSdkUrl, sdkClientId).catch(() => undefined);
  };

  const payerOf = () => {
    const data = new FormData(form);
    return {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      cpf: String(data.get("cpf") ?? ""),
    };
  };

  const fieldsAreValid = () => {
    let valid = true;
    form.querySelectorAll<HTMLInputElement>(".field input").forEach((input) => {
      const cpfDigits = input.name === "cpf" ? input.value.replace(/\D/g, "") : "";
      const ok = input.checkValidity() && (cpfDigits === "" || isValidCpf(cpfDigits));
      input.setAttribute("aria-invalid", String(!ok));
      valid &&= ok;
    });
    return valid;
  };

  const markInvalid = (fields: string[]) => {
    fields
      .filter((field) => field.startsWith("payer."))
      .forEach((field) =>
        form.querySelector(`input[name="${field.slice(6)}"]`)?.setAttribute("aria-invalid", "true"),
      );
  };

  const payWithPix = async () => {
    const charge = await api.startPix({ payer: payerOf(), fingerprint, idempotencyKey: crypto.randomUUID() });
    const expiresAt = new Date(charge.expiresAt);
    pix.show(charge.code, expiresAt);
    showStep("pix");
    waitUntilPaid(charge.orderId, expiresAt);
  };

  const payWithCard = async () => {
    const card = cardFieldsOf(form);
    if (card === null) throw new CheckoutError("invalid");
    if (!sdkClientId) throw new CheckoutError("unavailable");

    const payer = payerOf();
    const sdk = await loadCaktoSdk(caktoSdkUrl, sdkClientId).catch(() => {
      throw new CheckoutError("unavailable");
    });
    const { cardToken } = await sdk.createToken(card);
    const authentication = await sdk.authenticate3DS({
      card,
      customer: {
        amount,
        currency: "BRL",
        email: payer.email,
        name: payer.name,
        phone: payer.phone.replace(/\D/g, ""),
        paymentMethod: "credit",
      },
    });
    if (!authentication.success) return showError("authentication");

    await sdk.completeAntifraudProfile();
    const charge = await api.chargeCard({
      payer,
      fingerprint,
      idempotencyKey: crypto.randomUUID(),
      cardToken,
      antifraudReference: sdk.getAntifraudReference(),
      threeDSecure: {
        cavv: authentication.cavv,
        eci: authentication.eci,
        xid: authentication.xid,
        referenceId: authentication.referenceId,
        version: authentication.version,
      },
    });

    if (charge.outcome === "paid") return showStep("paid");
    if (charge.outcome === "declined") return showError("declined");
    showStep("pending");
    waitUntilPaid(charge.orderId, null);
  };

  form.addEventListener("change", (event) => {
    if ((event.target as HTMLInputElement).name === "method") onMethodChange();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError(null);
    if (!fieldsAreValid()) return showError("invalid");

    submit.disabled = true;
    try {
      await (method() === "card" ? payWithCard() : payWithPix());
    } catch (error) {
      if (error instanceof CheckoutError) markInvalid(error.fields);
      showError(error instanceof CheckoutError ? error.failure : "unavailable");
    } finally {
      submit.disabled = false;
    }
  });

  root.querySelector("[data-pix-again]")?.addEventListener("click", () => {
    stopWaiting?.();
    showStep("form");
  });

  onMethodChange();
}

function required<Found extends Element = HTMLElement>(scope: ParentNode, selector: string): Found {
  const element = scope.querySelector<Found>(selector);
  if (element === null) throw new Error(`Checkout markup is missing ${selector}`);
  return element;
}
