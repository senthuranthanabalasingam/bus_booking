import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return Response.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  if (err instanceof SyntaxError) {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  console.error(err);
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}

/** Wraps a route handler so thrown HttpError/ZodError become JSON error responses. */
export function handler<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Postgres unique_violation. */
export const isUniqueViolation = (err: unknown) =>
  typeof err === "object" && err !== null && "code" in err && err.code === "23505";
