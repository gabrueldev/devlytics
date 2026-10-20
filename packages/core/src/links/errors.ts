export class InvalidLinkError extends Error {
  override readonly name = "InvalidLinkError";

  constructor(readonly label: string) {
    super(`Cannot build a link from "${label}"`);
  }
}

export class LinkTakenError extends Error {
  override readonly name = "LinkTakenError";

  constructor(readonly slug: string) {
    super(`The link "${slug}" already exists on this site`);
  }
}

export class LinkNotFoundError extends Error {
  override readonly name = "LinkNotFoundError";

  constructor(readonly linkId: string) {
    super(`Link "${linkId}" does not exist on this site`);
  }
}
