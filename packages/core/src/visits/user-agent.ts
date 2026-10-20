export type Device = "mobile" | "tablet" | "desktop";
export type Browser = "edge" | "opera" | "samsung" | "chrome" | "firefox" | "safari" | "other";

const botPattern =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|axios|node-fetch/i;

const browserPatterns: [Browser, RegExp][] = [
  ["edge", /edg(e|a|ios)?\//i],
  ["opera", /opr\/|opera/i],
  ["samsung", /samsungbrowser/i],
  ["chrome", /chrome|crios/i],
  ["firefox", /firefox|fxios/i],
  ["safari", /safari/i],
];

export function isBot(userAgent: string): boolean {
  return userAgent.trim() === "" || botPattern.test(userAgent);
}

export function deviceOf(userAgent: string): Device {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

export function browserOf(userAgent: string): Browser {
  return browserPatterns.find(([, pattern]) => pattern.test(userAgent))?.[0] ?? "other";
}
