import { Hono } from "hono";
import { healthRoutes } from "./routes/health";

const app = new Hono<{ Bindings: Env }>().basePath("/api").route("/", healthRoutes);

export default app;
