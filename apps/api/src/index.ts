import { Hono } from "hono";
import type { AppEnv } from "./app-env";
import { demoRoutes } from "./routes/demo";
import { healthRoutes } from "./routes/health";

const app = new Hono<AppEnv>().basePath("/api").route("/", healthRoutes).route("/", demoRoutes);

export default app;
