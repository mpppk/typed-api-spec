import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { typed, ValidateLocals, validatorMiddleware } from "./index";
import { ZodApiEndpoints } from "../zod";
import { z } from "zod";
import { Request } from "express";
import { ParseUrlParams } from "../common";

describe("validatorMiddleware", () => {
  const pathMap = {
    "/": {
      get: {
        query: z.object({
          name: z.string(),
        }),
        // typed-api-spec allows to define body in GET method, but it is not recommended
        body: z.object({
          name: z.string(),
        }),
        headers: z.object({
          "content-type": z.literal("application/json"),
        }),
        params: z.object({
          name: z.string(),
        }),
        resBody: {
          200: z.object({
            id: z.string(),
            name: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
  } satisfies ZodApiEndpoints;
  const middleware = validatorMiddleware(pathMap);
  const next = vi.fn();

  describe("request to endpoint which is defined in ApiSpec", () => {
    it("should success to validate request", () => {
      const req: Partial<Request> = {
        query: { name: "alice" },
        body: { name: "alice" },
        headers: { "content-type": "application/json" },
        params: { name: "alice" },
        // "/" endpoint is defined in pathMap
        path: "/",
        method: "get",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = { locals: {} } as any;
      middleware(req as Request, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.validate).toEqual(expect.any(Function));
      const locals = res.locals as ValidateLocals<
        (typeof pathMap)["/"]["get"],
        ParseUrlParams<"/">
      >;
      const validate = locals.validate(req as Request);

      const query = validate.query();
      expect(query.success).toBe(true);
      expect(query.data!.name).toBe("alice");

      const body = validate.body();
      expect(body.success).toBe(true);
      expect(body.data!.name).toBe("alice");

      const headers = validate.headers();
      expect(headers.success).toBe(true);
      expect(headers.data!["content-type"]).toBe("application/json");
    });

    it("should fail if request schema is invalid", () => {
      const req: Partial<Request> = {
        query: { desc: "test" },
        body: { desc: "test" },
        headers: {},
        params: { desc: "test" },
        // "/" endpoint is defined in pathMap
        path: "/",
        method: "get",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = { locals: {} } as any;
      middleware(req as Request, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.validate).toEqual(expect.any(Function));
      const locals = res.locals as ValidateLocals<
        (typeof pathMap)["/"]["get"],
        ParseUrlParams<"/">
      >;
      const validate = locals.validate(req as Request);

      const query = validate.query();
      expect(query.success).toBe(false);

      const body = validate.body();
      expect(body.success).toBe(false);

      const headers = validate.headers();
      expect(headers.success).toBe(false);
    });
  });

  describe("request to endpoint which is not defined in ApiSpec", () => {
    it("have invalid path and valid method", () => {
      const req: Partial<Request> = {
        query: { name: "alice" },
        body: { name: "alice" },
        headers: { "content-type": "application/json" },
        params: { name: "alice" },
        // "/users" endpoint is not defined in pathMap
        path: "/users",
        method: "get",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = { locals: {} } as any;
      middleware(req as unknown as Request, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.validate).toEqual(expect.any(Function));
      const locals = res.locals as ValidateLocals<
        undefined,
        ParseUrlParams<"">
      >;
      const validate = locals.validate(req as Request);

      const query = validate.query;
      expect(query).toBeUndefined();

      const body = validate.body;
      expect(body).toBeUndefined();

      const headers = validate.headers;
      expect(headers).toBeUndefined();

      const params = validate.params;
      expect(params).toBeUndefined();
    });

    it("have valid path and invalid method", () => {
      const req: Partial<Request> = {
        query: { name: "alice" },
        body: { name: "alice" },
        headers: { "content-type": "application/json" },
        params: { name: "alice" },
        // "/" endpoint is defined but patch method is not defined in pathMap
        path: "/",
        method: "patch",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = { locals: {} } as any;
      middleware(req as unknown as Request, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.validate).toEqual(expect.any(Function));
      const locals = res.locals as ValidateLocals<
        undefined,
        ParseUrlParams<"">
      >;
      const validate = locals.validate(req as Request);

      const query = validate.query;
      expect(query).toBeUndefined();

      const body = validate.body;
      expect(body).toBeUndefined();

      const headers = validate.headers;
      expect(headers).toBeUndefined();

      const params = validate.params;
      expect(params).toBeUndefined();
    });
  });
});

const newApp = () => {
  const app = express();
  app.use(express.json());
  return app;
};
describe("typed", () => {
  const UserId = z.object({ id: z.string() });
  const UserName = z.object({ name: z.string() });
  const User = UserName.merge(UserId);
  const Err = z.object({ message: z.string() });
  const BadRequest = { 400: Err };
  const pathMap = {
    "/users": {
      get: {
        resBody: { 200: z.array(User) },
      },
      post: {
        body: UserName,
        resBody: { 200: User, ...BadRequest },
      },
    },
    "/users/:id": {
      get: {
        params: z.object({ id: z.string() }),
        headers: z.object({
          "content-type": z.literal("application/json"),
        }),
        query: z.object({
          detail: z.union([z.literal("true"), z.literal("false")]),
        }),
        resBody: { 200: User, ...BadRequest },
      },
    },
  } satisfies ZodApiEndpoints;

  it("ok", async () => {
    const app = newApp();
    const wApp = typed(pathMap, app);
    wApp.get("/users", (req, res) => {
      return res.json([{ id: "1", name: "alice" }]);
    });
    wApp.post("/users", (req, res) => {
      const body = res.locals.validate(req).body();
      if (!body.success) {
        return res.status(400).json({ message: "invalid body" });
      }
      return res.json({ id: "1", name: body.data.name });
    });
    wApp.get("/users/:id", (req, res) => {
      const qResult = res.locals.validate(req).query();
      const pResult = res.locals.validate(req).params();
      if (!pResult.success) {
        return res.status(400).json({ message: "invalid query" });
      }
      if (qResult.success) {
        return res.status(200).json({ id: pResult.data.id, name: "alice" });
      }
      return res.status(200).json({ id: pResult.data.id, name: "alice" });
    });

    {
      const res = await request(app).get("/users");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: "1", name: "alice" }]);
    }

    {
      const res = await request(app).post("/users").send({ name: "alice" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: "1", name: "alice" });
    }

    {
      const res = await request(app).get("/users/99");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: "99", name: "alice" });
    }
  });
});
