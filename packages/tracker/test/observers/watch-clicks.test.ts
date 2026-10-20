import { describe, expect, it } from "vitest";
import { createTargetRegistry } from "../../src/detection/target-registry";
import { clickEventFor } from "../../src/observers/watch-clicks";

const pageOrigin = "https://fulano.dev";

const setUp = (html: string) => {
  document.body.innerHTML = html;
  const registry = createTargetRegistry(document);
  registry.refresh();
  return registry;
};

const element = (selector: string) => {
  const found = document.querySelector(selector);
  if (found === null) throw new Error(`Missing ${selector}`);
  return found;
};

describe("clickEventFor", () => {
  it("ties a repository click to the project it belongs to", () => {
    const registry = setUp(
      `<article><h3>Store</h3><a id="code" href="https://github.com/fulano/store"><span>Code</span></a></article>`,
    );

    expect(clickEventFor(element("#code span"), registry, pageOrigin)).toEqual({
      type: "click",
      action: "repo",
      project: "Store",
    });
  });

  it("prefers the action the developer marked", () => {
    const registry = setUp(`<button data-track="copy-email">Copy</button>`);

    expect(clickEventFor(element("button"), registry, pageOrigin)).toEqual({
      type: "click",
      action: "copy-email",
    });
  });

  it("ignores clicks that mean nothing for a portfolio", () => {
    const registry = setUp(`<p>Just text</p>`);

    expect(clickEventFor(element("p"), registry, pageOrigin)).toBeNull();
  });
});
