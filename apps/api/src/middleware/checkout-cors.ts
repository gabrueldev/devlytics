import { cors } from "hono/cors";

const productSiteOrigins = [
  "https://devlytics.gabrueldev.com",
  "https://devlytics-web.gabrueldev.workers.dev",
];

export const checkoutCors = cors({ origin: productSiteOrigins, allowMethods: ["GET", "POST"] });
