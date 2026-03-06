import { createMiddleware } from "hono/factory";
import type { Env } from "../index";

export type AuthVariables = {
  tenant_id: string;
};

function buildTokenMap(env: Env): Map<string, string> {
  return new Map([
    [env.TENANT_A_TOKEN, "tenant_a"],
    [env.TENANT_B_TOKEN, "tenant_b"],
  ]);
}

/**
 * Authentication middleware.
 *
 * Expects every request to carry:
 *   Authorization: Bearer <token>
 *
 * On success  → resolves tenant_id and sets it in context via c.set()
 * On failure  → returns 401 with a JSON error body and stops the chain
 *
 * Deliberately vague error messages to avoid leaking which part failed
 * (missing header vs invalid token).
 */
export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AuthVariables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Missing or malformed Authorization header.",
      },
      401,
    );
  }

  const token = authHeader.slice(7);

  if (!token) {
    return c.json(
      { error: "Unauthorized", message: "Bearer token is empty." },
      401,
    );
  }

  const tokenMap = buildTokenMap(c.env);
  const tenant_id = tokenMap.get(token);

  if (!tenant_id) {
    return c.json({ error: "Unauthorized", message: "Invalid token." }, 401);
  }

  // Inject tenant identity into context — routes read this via c.get('tenant_id')
  c.set("tenant_id", tenant_id);

  await next();
});
