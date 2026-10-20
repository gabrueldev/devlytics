import { beforeEach, describe, expect, it } from "vitest";
import { findProjects } from "../../src/detection/projects";

const targetsOf = () => findProjects(document).map((project) => project.target);

describe("findProjects", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("finds a card by the repository link next to its title", () => {
    document.body.innerHTML = `
      <section id="projects">
        <h2>Projects</h2>
        <article><h3>Online store</h3><a href="https://github.com/fulano/store">Code</a></article>
        <article><h3>Chat</h3><a href="https://github.com/fulano/chat">Code</a></article>
      </section>`;

    expect(targetsOf()).toEqual(["Online store", "Chat"]);
  });

  it("finds a card whose title is the repository link itself", () => {
    document.body.innerHTML = `
      <article><div class="text"><h3><a href="https://github.com/fulano/MagazineAPI">MagazineAPI</a></h3><p>Room booking</p></div></article>`;

    expect(targetsOf()).toEqual(["MagazineAPI"]);
  });

  it("counts a card once even with several links to the same repository", () => {
    document.body.innerHTML = `
      <article><h3>Store</h3><a href="https://github.com/fulano/store">Code</a><a href="https://github.com/fulano/store/issues">Issues</a></article>`;

    expect(targetsOf()).toEqual(["Store"]);
  });

  it("ignores profile links, which are not projects", () => {
    document.body.innerHTML = `<section><h2>About</h2><a href="https://github.com/fulano">GitHub</a></section>`;

    expect(targetsOf()).toEqual([]);
  });

  it("does not mistake a section of untitled cards for one project", () => {
    document.body.innerHTML = `
      <section><h2>Projects</h2>
        <div><a href="https://github.com/fulano/a">A</a></div>
        <div><a href="https://github.com/fulano/b">B</a></div>
      </section>`;

    expect(targetsOf()).toEqual([]);
  });

  it("trusts only the marked projects once the developer marks any", () => {
    document.body.innerHTML = `
      <article data-project=" Online store "><a href="https://store.fulano.dev">Demo</a></article>
      <article><h3>Chat</h3><a href="https://github.com/fulano/chat">Code</a></article>`;

    expect(targetsOf()).toEqual(["Online store"]);
  });
});
