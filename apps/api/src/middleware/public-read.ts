import { cache } from "hono/cache";
import { cors } from "hono/cors";
import { every } from "hono/combine";

export const publicRead = (maxAgeSeconds: number) =>
  every(
    cors({ origin: "*" }),
    cache({ cacheName: "devlytics-api", cacheControl: `public, max-age=${maxAgeSeconds}` }),
  );
