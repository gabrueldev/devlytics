import type { Locale } from "../i18n";

export const dashboardPathFor = (locale: Locale) => (locale === "pt" ? "/painel" : "/en/dashboard");
