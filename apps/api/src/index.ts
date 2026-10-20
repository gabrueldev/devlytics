import { Hono } from "hono";
import type { AppEnv } from "./app-env";
import { coffeeRoutes } from "./routes/coffees";
import { demoRoutes } from "./routes/demo";
import { healthRoutes } from "./routes/health";

const app = new Hono<AppEnv>()
  .basePath("/api")
  .route("/", healthRoutes)
  .route("/", demoRoutes)
  .route("/", coffeeRoutes);

export default app;
