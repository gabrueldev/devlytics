import { coffeeCountEndpoint } from "../config/coffee";

export async function showCoffeeCount(): Promise<void> {
  const coffee = document.querySelector<HTMLElement>("[data-coffee]");
  const label = coffee?.querySelector<HTMLElement>("[data-coffee-count]");
  if (!coffee || !label) return;

  const count = await fetchCount();
  if (count === null || count < 1) return;

  const formatted = new Intl.NumberFormat(coffee.dataset.locale).format(count);
  const template = (count === 1 ? coffee.dataset.one : coffee.dataset.many) ?? "";
  label.textContent = template.replace("{count}", formatted);
  label.hidden = false;
}

async function fetchCount(): Promise<number | null> {
  try {
    const response = await fetch(coffeeCountEndpoint, { headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const { count } = (await response.json()) as { count: unknown };
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}
