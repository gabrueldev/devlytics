import type { Locale } from "../i18n";
export const coffeeApiUrl = "https://devlytics.gabrueldev.com/api/coffees";
export const coffeeCountEndpoint = coffeeApiUrl;
export const coffeePriceCents = 1261;
export const caktoSdkUrl = "https://cakto-sdk.pages.dev/cakto-sdk.min.js";
export const caktoSdkClientId = "";
export const coffeePathFor = (locale: Locale) => (locale === "pt" ? "/cafe" : "/en/coffee");
