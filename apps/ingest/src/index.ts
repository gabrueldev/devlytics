import { Hono } from "hono";
import { healthRoutes } from "./routes/health";

const app = new Hono<{ Bindings: Env }>().route("/", healthRoutes);

export default app;
