import { Hono } from "hono";
import type { AppEnv } from "./app-env";
import { sameOrigin } from "./middleware/same-origin";
import { authRoutes } from "./routes/auth";
import { coffeeCheckoutRoutes } from "./routes/coffee-checkout";
import { coffeeRoutes } from "./routes/coffees";
import { demoRoutes } from "./routes/demo";
import { healthRoutes } from "./routes/health";
import { linkRoutes } from "./routes/links";
import { siteRoutes } from "./routes/sites";

const app = new Hono<AppEnv>()
  .basePath("/api")
  .route("/", healthRoutes)
  .route("/", demoRoutes)
  .route("/", coffeeRoutes)
  .route("/", coffeeCheckoutRoutes)
  .use("/auth/logout", sameOrigin)
  .use("/sites/*", sameOrigin)
  .use("/sites", sameOrigin)
  .route("/", authRoutes)
  .route("/", siteRoutes)
  .route("/", linkRoutes);

export default app;
