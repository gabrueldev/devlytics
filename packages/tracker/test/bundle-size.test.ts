import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

const budgetBytes = 3 * 1024;

describe("tracker bundle", () => {
  it("stays under 3 KB gzipped", () => {
    const bundle = readFileSync(resolve(process.cwd(), "dist/t.js"));

    expect(gzipSync(bundle).byteLength).toBeLessThan(budgetBytes);
  });
});
