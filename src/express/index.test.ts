import { describe, it, expect, vi } from "vitest";
import { ValidateLocals, validatorMiddleware } from "./index";
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
        },
      },
    },
  } satisfies ZodApiEndpoints;
  const middleware = validatorMiddleware(pathMap);
  const next = vi.fn();

  it("request to endpoint which is defined in ApiSpec", () => {
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

  it("request to endpoint which is defined in ApiSpec", () => {
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

  it("request to endpoint which is not defined in ApiSpec", () => {
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
    const locals = res.locals as ValidateLocals<undefined, ParseUrlParams<"">>;
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

  it("request to endpoint which is not defined in ApiSpec", () => {
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
    const locals = res.locals as ValidateLocals<undefined, ParseUrlParams<"">>;
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
