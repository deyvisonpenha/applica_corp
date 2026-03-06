import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import tasksRouter from "./routes/tasks";

export type Env = {
  DATABASE_URL: string;
  TENANT_A_TOKEN: string;
  TENANT_B_TOKEN: string;
  ALLOWED_ORIGIN?: string;
};

export type Variables = {
  tenant_id: string;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", async (c, next) => {
  const allowedOrigin = c.env.ALLOWED_ORIGIN ?? "*";

  return cors({
    origin: allowedOrigin,
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
    maxAge: 600, // cache preflight for 10 minutes
  })(c, next);
});

app.get("/health", (c) => {
  return c.json({ status: "ok" }, 200);
});

app.use("/tasks/*", authMiddleware);

app.route("/tasks", tasksRouter);

export default app;
