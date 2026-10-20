import { describe, expect, it } from "vitest";
import { findSections } from "../../src/detection/sections";

describe("findSections", () => {
  it("names sections after their id or their data-section mark", () => {
    document.body.innerHTML = `
      <section id="about"></section>
      <div data-section="contact"></div>
      <section data-section="work" id="projects"></section>
      <section></section>`;

    expect(findSections(document).map((section) => section.target)).toEqual(["about", "contact", "work"]);
  });
});
