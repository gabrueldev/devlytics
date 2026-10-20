import { DashboardApiError, type DashboardApi, type SiteSummary } from "./dashboard-api";

export interface NewSiteTexts {
  invalid: string;
  taken: string;
  failed: string;
}

export function mountNewSiteForm(
  slot: HTMLElement,
  template: HTMLTemplateElement,
  api: DashboardApi,
  texts: NewSiteTexts,
  handlers: { onAdded: (site: SiteSummary) => void; onCancel?: () => void },
): HTMLFormElement {
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const form = fragment.querySelector("form");
  if (form === null) throw new Error("New site template has no form");
  slot.replaceChildren(fragment);

  const error = form.querySelector<HTMLElement>("[data-form-error]");
  const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
  const cancel = form.querySelector<HTMLButtonElement>("[data-cancel]");
  if (cancel) cancel.hidden = handlers.onCancel === undefined;
  cancel?.addEventListener("click", () => handlers.onCancel?.());

  const showError = (message: string | null) => {
    if (!error) return;
    error.hidden = message === null;
    error.textContent = message ?? "";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const domain = String(data.get("domain") ?? "").trim();
    if (!domain) return showError(texts.invalid);

    showError(null);
    if (submit) submit.disabled = true;
    try {
      const site = await api.addSite({ name: String(data.get("name") ?? ""), domain });
      form.reset();
      handlers.onAdded(site);
    } catch (failure) {
      const code = failure instanceof DashboardApiError ? failure.code : "";
      showError(
        code === "invalid_domain" ? texts.invalid : code === "domain_taken" ? texts.taken : texts.failed,
      );
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  return form;
}
