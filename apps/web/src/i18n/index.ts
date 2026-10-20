import { en } from "./en";
import { pt, type Dictionary } from "./pt";

export type Locale = "pt" | "en";

const dictionaries: Record<Locale, Dictionary> = { pt, en };

export function dictionaryFor(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function homePathFor(locale: Locale): string {
  return locale === "pt" ? "/" : "/en/";
}

export type { Dictionary };
