import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { json, productOrigin, quietCoffeeCount } from "./fake-api";

const tag = '<script defer src="https://devlytics.gabrueldev.com/t.js"></script>';
const site = { id: "site-1", name: "Ada", domain: "ada.dev" };

test("copies the tag from the home page", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Clipboard permissions are Chromium only");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await quietCoffeeCount(page);
  await page.goto("/");

  const heroTag = page.locator("[data-copy-tag]").first();
  await heroTag.getByRole("button").click();

  await expect(heroTag).toHaveClass(/is-copied/);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(tag);
});

test("registers a first site and shows the tag to install", async ({ page }) => {
  const user = { login: "ada", name: "Ada Lovelace", email: "ada@example.com", avatarUrl: null };
  let sites: (typeof site)[] = [];
  await page.route("**/api/me", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ user, sites }) }),
  );
  await page.route("**/api/sites", (route) => {
    sites = [site];
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(site) });
  });
  await json(page, /\/api\/sites\/site-1\/report/, {
    site,
    period: { days: 7, since: "2026-10-14", until: "2026-10-20" },
    visits: 0,
    averageAttentionMs: 0,
    daily: [],
    projects: [],
    sections: [],
    conversions: [],
    sources: [],
    countries: [],
    funnel: [],
  });

  await page.goto("/painel");
  await expect(page.getByRole("heading", { name: "Cadastre seu portfólio" })).toBeVisible();
  const onboarding = page.locator("[data-view-panel=onboarding]");
  await onboarding.getByLabel("Domínio").fill("ada.dev");
  await onboarding.getByLabel("Nome").fill("Ada");
  await onboarding.getByRole("button", { name: "Adicionar", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Instale a tag" })).toBeVisible();
  await expect(page.locator("[data-install] [data-copy-value]")).toHaveAttribute("data-copy-value", tag);
});

test("the installed tag reports a visit that came from a tracked link", async ({ page }) => {
  const tracker = await readFile(new URL("../../../packages/tracker/dist/t.js", import.meta.url), "utf8");
  await page.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  await page.route("https://ada.example/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head>${tag}</head><body><main><section id="projects"><h2>Projetos</h2></section></main></body></html>`,
    }),
  );
  await page.route(`${productOrigin}/t.js`, (route) =>
    route.fulfill({ contentType: "text/javascript", body: tracker }),
  );
  const collected = page.waitForRequest(`${productOrigin}/e`);
  await page.route(`${productOrigin}/e`, (route) => route.fulfill({ status: 204 }));

  await page.goto("https://ada.example/?ref=nubank");

  const payload = JSON.parse((await collected).postData() ?? "{}") as {
    url: string;
    ref: string;
    events: { type: string }[];
  };
  expect(payload).toMatchObject({ url: "https://ada.example/", ref: "nubank" });
  expect(payload.events.map((event) => event.type)).toContain("pageview");
});
