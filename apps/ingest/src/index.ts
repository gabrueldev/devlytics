import { Hono } from "hono";
import type { AppEnv } from "./app-env";
import { collectRoutes } from "./routes/collect";
import { healthRoutes } from "./routes/health";

const app = new Hono<AppEnv>().route("/", healthRoutes).route("/", collectRoutes);

export default app;
