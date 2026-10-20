import { expect, test, type Page } from "@playwright/test";
import { caktoSdkUrl, coffeeApi, fakeCaktoSdk, json, quietCoffeeCount } from "./fake-api";

const validCpf = "52998224725";

async function fillPayer(page: Page, cpf = validCpf): Promise<void> {
  await page.getByLabel("Nome completo").fill("Ada Lovelace");
  await page.getByLabel("E-mail").fill("ada@example.com");
  await page.getByLabel("Celular").pressSequentially("11999998888");
  await page.getByLabel("CPF").pressSequentially(cpf);
}

test.beforeEach(async ({ page }) => {
  await quietCoffeeCount(page);
});

test("formats phone and CPF while the visitor types", async ({ page }) => {
  await page.goto("/cafe");
  await fillPayer(page);

  await expect(page.getByLabel("Celular")).toHaveValue("(11) 99999-8888");
  await expect(page.getByLabel("CPF")).toHaveValue("529.982.247-25");
});

test("rejects an invalid CPF without calling the API", async ({ page }) => {
  const charges = await json(page, `${coffeeApi}/pix`, {});
  await page.goto("/cafe");
  await fillPayer(page, "11111111111");
  await page.getByRole("button", { name: "Gerar Pix" }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("CPF")).toHaveAttribute("aria-invalid", "true");
  expect(charges).toHaveLength(0);
});

test("pays with Pix and celebrates once the order is paid", async ({ page }) => {
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  const charges = await json(page, `${coffeeApi}/pix`, {
    orderId: "order-1",
    code: "00020101021226pix-code",
    expiresAt,
  });
  let polls = 0;
  await page.route(`${coffeeApi}/orders/order-1`, (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ paid: ++polls > 1 }) }),
  );

  await page.goto("/cafe");
  await fillPayer(page);
  await page.getByRole("button", { name: "Gerar Pix" }).click();

  await expect(page.locator("[data-pix-qr] svg")).toBeVisible();
  await expect(page.locator("[data-pix-timer]")).not.toBeEmpty();
  expect(charges[0]?.postDataJSON()).toMatchObject({
    payer: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "(11) 99999-8888",
      cpf: "529.982.247-25",
    },
  });

  await expect(page.locator("[data-step-panel=paid]")).toBeVisible({ timeout: 15_000 });
});

test("pays with a card through the Cakto SDK", async ({ page }) => {
  await page.route(caktoSdkUrl, (route) =>
    route.fulfill({ contentType: "text/javascript", body: fakeCaktoSdk }),
  );
  const charges = await json(page, `${coffeeApi}/card`, { orderId: "order-2", outcome: "paid" });

  await page.goto("/cafe");
  await page.getByText("Cartão", { exact: true }).click();
  await fillPayer(page);
  await page.getByLabel("Número do cartão").pressSequentially("4111111111111111");
  await page.getByLabel("Nome impresso no cartão").fill("ADA LOVELACE");
  await page.getByLabel("Validade").pressSequentially("1230");
  await page.getByLabel("CVV").fill("123");

  await expect(page.getByLabel("Número do cartão")).toHaveValue("4111 1111 1111 1111");
  await expect(page.getByLabel("Validade")).toHaveValue("12/30");

  await page.getByRole("button", { name: "Pagar R$ 12,61" }).click();

  await expect(page.locator("[data-step-panel=paid]")).toBeVisible();
  expect(charges[0]?.postDataJSON()).toMatchObject({
    cardToken: "card-token-1",
    antifraudReference: "antifraud-1",
    threeDSecure: { eci: "05" },
  });
});

test("explains a declined card and keeps the form", async ({ page }) => {
  await page.route(caktoSdkUrl, (route) =>
    route.fulfill({ contentType: "text/javascript", body: fakeCaktoSdk }),
  );
  await json(page, `${coffeeApi}/card`, { orderId: "order-3", outcome: "declined" });

  await page.goto("/cafe");
  await page.getByText("Cartão", { exact: true }).click();
  await fillPayer(page);
  await page.getByLabel("Número do cartão").pressSequentially("4000000000000002");
  await page.getByLabel("Nome impresso no cartão").fill("ADA LOVELACE");
  await page.getByLabel("Validade").pressSequentially("1230");
  await page.getByLabel("CVV").fill("123");
  await page.getByRole("button", { name: "Pagar R$ 12,61" }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator("form[data-step-panel=form]")).toBeVisible();
});
