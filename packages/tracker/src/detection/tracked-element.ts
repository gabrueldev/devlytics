export interface TrackedElement {
  element: Element;
  kind: "project" | "section";
  target: string;
}
