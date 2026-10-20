import { describe, expect, it } from "vitest";
import { browserOf, deviceOf, isBot } from "../../src";

const iphoneSafari =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const macChrome =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const windowsEdge =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0";
const androidTablet =
  "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const androidPhoneFirefox = "Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0";

describe("deviceOf", () => {
  it.each([
    [iphoneSafari, "mobile"],
    [androidPhoneFirefox, "mobile"],
    [androidTablet, "tablet"],
    [macChrome, "desktop"],
  ])("classifies %s", (userAgent, device) => {
    expect(deviceOf(userAgent)).toBe(device);
  });
});

describe("browserOf", () => {
  it.each([
    [iphoneSafari, "safari"],
    [macChrome, "chrome"],
    [windowsEdge, "edge"],
    [androidPhoneFirefox, "firefox"],
    ["Mystery/1.0", "other"],
  ])("classifies %s", (userAgent, browser) => {
    expect(browserOf(userAgent)).toBe(browser);
  });
});

describe("isBot", () => {
  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "facebookexternalhit/1.1",
    "WhatsApp/2.23.20.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36",
    "curl/8.7.1",
    "",
  ])("recognizes %j as a bot", (userAgent) => {
    expect(isBot(userAgent)).toBe(true);
  });

  it("lets real browsers through", () => {
    expect(isBot(macChrome)).toBe(false);
  });
});
