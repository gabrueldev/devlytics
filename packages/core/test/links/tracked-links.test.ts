import { describe, expect, it } from "vitest";
import {
  createTrackedLink,
  InvalidLinkError,
  LinkNotFoundError,
  LinkTakenError,
  noticeLinkOpened,
  removeTrackedLink,
  slugFrom,
  type Mail,
  type User,
} from "../../src";
import { InMemorySiteCatalog } from "../fakes/in-memory-site-catalog";
import { InMemoryTrackedLinks } from "../fakes/in-memory-tracked-links";

const now = new Date("2026-10-20T15:00:00Z");
const site = { id: "site_1", userId: "user_1", name: "Fulano", domain: "fulano.dev", createdAt: now };
const owner: User = {
  id: "user_1",
  githubId: "1",
  login: "fulano",
  email: "fulano@dev.com",
  name: "Fulano",
  avatarUrl: null,
  createdAt: now,
};

const setup = () => {
  const sites = new InMemorySiteCatalog([site]);
  const links = new InMemoryTrackedLinks();
  const create = createTrackedLink({
    sites,
    links,
    newId: () => `link_${links.links.length + 1}`,
    now: () => now,
  });
  return { sites, links, create };
};

describe("slugFrom", () => {
  it("turns a job title into something safe for a URL", () => {
    expect(slugFrom("Nubank — Front-end Pleno")).toBe("nubank-front-end-pleno");
    expect(slugFrom("  Itaú / São Paulo ")).toBe("itau-sao-paulo");
  });
});

describe("createTrackedLink", () => {
  it("builds the ref from the label when no ref is given", async () => {
    const { create } = setup();

    const link = await create("user_1", "site_1", { label: "Nubank — Front-end Pleno" });

    expect(link).toMatchObject({
      slug: "nubank-front-end-pleno",
      label: "Nubank — Front-end Pleno",
      firstOpenedAt: null,
    });
  });

  it("keeps a custom ref short and clean", async () => {
    const { create } = setup();

    await expect(create("user_1", "site_1", { label: "Nubank", slug: "NU 2026" })).resolves.toMatchObject({
      slug: "nu-2026",
    });
  });

  it("refuses a ref the site already uses", async () => {
    const { create } = setup();
    await create("user_1", "site_1", { label: "Nubank" });

    await expect(create("user_1", "site_1", { label: "nubank" })).rejects.toBeInstanceOf(LinkTakenError);
  });

  it("refuses a label with nothing usable in it", async () => {
    await expect(setup().create("user_1", "site_1", { label: " — " })).rejects.toBeInstanceOf(
      InvalidLinkError,
    );
  });
});

describe("removeTrackedLink", () => {
  it("does not reach links of a site owned by someone else", async () => {
    const { sites, links, create } = setup();
    const link = await create("user_1", "site_1", { label: "Nubank" });

    await expect(removeTrackedLink({ sites, links })("user_2", "site_1", link.id)).rejects.toThrow();
    await expect(removeTrackedLink({ sites, links })("user_1", "site_1", "missing")).rejects.toBeInstanceOf(
      LinkNotFoundError,
    );
  });
});

describe("noticeLinkOpened", () => {
  const notice = (links: InMemoryTrackedLinks, sites: InMemorySiteCatalog, sent: Mail[]) =>
    noticeLinkOpened({
      links,
      sites,
      users: { findById: async () => owner, saveFromGithub: async () => owner },
      mailer: { send: async (mail) => void sent.push(mail) },
      dashboardUrl: (siteId, linkId) => `https://devlytics.test/painel?site=${siteId}&link=${linkId}`,
      text: {
        subject: (label) => `O link "${label}" foi aberto`,
        body: (label, domain, url) => `Abriram ${label} em ${domain}. Veja: ${url}`,
      },
    });

  it("e-mails the owner only the first time a link is opened", async () => {
    const { sites, links, create } = setup();
    await create("user_1", "site_1", { label: "Nubank" });
    const sent: Mail[] = [];

    await expect(notice(links, sites, sent)("site_1", "Nubank", now)).resolves.toBe(true);
    await expect(notice(links, sites, sent)("site_1", "nubank", now)).resolves.toBe(false);

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "fulano@dev.com", subject: 'O link "Nubank" foi aberto' });
    expect(sent[0]?.html).toContain('<a href="https://devlytics.test/painel?site=site_1&amp;link=link_1">');
  });

  it("ignores refs that were never registered", async () => {
    const { sites, links } = setup();
    const sent: Mail[] = [];

    await expect(notice(links, sites, sent)("site_1", "random", now)).resolves.toBe(false);
    expect(sent).toEqual([]);
  });
});
