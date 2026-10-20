import { describe, expect, it } from "vitest";
import { classifyLink } from "../../src/detection/classify-link";

const pageOrigin = "https://fulano.dev";

const linkTo = (href: string) => {
  const link = document.createElement("a");
  link.href = href;
  return link;
};

describe("classifyLink", () => {
  it.each([
    ["mailto:fulano@dev.com", "email"],
    ["https://github.com/fulano/store", "repo"],
    ["https://gitlab.com/fulano/store", "repo"],
    ["https://github.com/fulano", "github"],
    ["https://www.linkedin.com/in/fulano", "linkedin"],
    ["https://br.linkedin.com/in/fulano", "linkedin"],
    ["https://wa.me/5511999999999", "whatsapp"],
    ["https://api.whatsapp.com/send?phone=55", "whatsapp"],
    ["https://fulano.dev/cv.PDF", "cv"],
  ])("classifies %s as %s", (href, action) => {
    expect(classifyLink(linkTo(href), false, pageOrigin)).toBe(action);
  });

  it("treats external links inside a project as its demo", () => {
    expect(classifyLink(linkTo("https://store.fulano.dev"), true, pageOrigin)).toBe("demo");
  });

  it("ignores external links outside projects", () => {
    expect(classifyLink(linkTo("https://store.fulano.dev"), false, pageOrigin)).toBeNull();
  });

  it("ignores internal navigation", () => {
    expect(classifyLink(linkTo("https://fulano.dev/about"), true, pageOrigin)).toBeNull();
  });
});
