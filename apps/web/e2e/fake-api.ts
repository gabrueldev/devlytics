import type { Page, Request } from "@playwright/test";

export const productOrigin = "https://devlytics.gabrueldev.com";
export const coffeeApi = `${productOrigin}/api/coffees`;
export const caktoSdkUrl = "https://cakto-sdk.pages.dev/cakto-sdk.min.js";

export async function json(
  page: Page,
  url: string | RegExp,
  body: unknown,
  status = 200,
): Promise<Request[]> {
  const seen: Request[] = [];
  await page.route(url, (route) => {
    seen.push(route.request());
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  return seen;
}

export async function quietCoffeeCount(page: Page): Promise<void> {
  await page.route(coffeeApi, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ contentType: "application/json", body: JSON.stringify({ count: 0 }) })
      : route.fallback(),
  );
}

export const fakeCaktoSdk = `
  window.Cakto = {
    CaktoSDK: class {
      initAntifraud() { return Promise.resolve(); }
      completeAntifraudProfile() { return Promise.resolve(); }
      getAntifraudReference() { return "antifraud-1"; }
      createToken() { return Promise.resolve({ cardToken: "card-token-1" }); }
      authenticate3DS() {
        return Promise.resolve({ success: true, cavv: "cavv", eci: "05", xid: "xid", referenceId: "ref", version: "2.2.0" });
      }
    },
  };
`;
