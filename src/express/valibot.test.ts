import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { asAsync, ValidateLocals, validatorMiddleware } from "./index";
import * as v from "valibot";
import { Request } from "express";
import { ParseUrlParams } from "../core";
import { ToHandlers, typed } from "./valibot";
import {
  newValibotValidator,
  ValibotApiEndpoints,
  ValibotApiSpec,
  ValibotValidators,
} from "../valibot";
import {
  newValidatorMethodNotFoundError,
  newValidatorPathNotFoundError,
} from "../core/validator/validate";

type ValibotValidateLocals<
  AS extends ValibotApiSpec,
  ParamKeys extends string,
> = ValidateLocals<ValibotValidators<AS, ParamKeys>>;

const newApp = () => {
  const app = express();
  app.use(express.json());
  return app;
};

describe("valibot", () => {
  describe("validatorMiddleware", () => {
    const pathMap = {
      "/": {
        get: {
          query: v.object({
            name: v.string(),
          }),
          // typed-api-spec allows to define body in GET method, but it is not recommended
          body: v.object({
            name: v.string(),
          }),
          headers: v.object({
            "content-type": v.literal("application/json"),
          }),
          params: v.object({
            name: v.string(),
          }),
          responses: {
            200: {
              body: v.object({
                id: v.string(),
                name: v.string(),
              }),
            },
            400: {
              body: v.object({
                message: v.string(),
              }),
            },
          },
        },
      },
    } satisfies ValibotApiEndpoints;
    const { req: reqValidator } = newValibotValidator(pathMap);
    const middleware = validatorMiddleware(reqValidator);
    const next = vi.fn();

    describe("request to endpoint which is defined in ApiSpec", () => {
      it("should success to validate request", () => {
        const req: Partial<Request> = {
          query: { name: "alice" },
          body: { name: "alice" },
          headers: { "content-type": "application/json" },
          params: { name: "alice" },
          // "/" endpoint is defined in pathMap
          route: { path: "/" },
          method: "get",
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = { locals: {} } as any;
        middleware(req as Request, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.locals.validate).toEqual(expect.any(Function));
        const locals = res.locals as ValibotValidateLocals<
          (typeof pathMap)["/"]["get"],
          ParseUrlParams<"/">
        >;
        const validate = locals.validate(req as Request);

        {
          const r = validate.query();
          expect(r.error).toBeUndefined();
          expect(r.data?.name).toBe("alice");
        }

        {
          const r = validate.body();
          expect(r.error).toBeUndefined();
          expect(r.data?.name).toBe("alice");
        }

        {
          const r = validate.headers();
          expect(r.error).toBeUndefined();
          expect(r.data?.["content-type"]).toBe("application/json");
        }
      });

      it("should fail if request schema is invalid", () => {
        const req: Partial<Request> = {
          query: { desc: "test" },
          body: { desc: "test" },
          headers: {},
          params: { desc: "test" },
          // "/" endpoint is defined in pathMap
          route: { path: "/" },
          method: "get",
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = { locals: {} } as any;
        middleware(req as Request, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.locals.validate).toEqual(expect.any(Function));
        const locals = res.locals as ValibotValidateLocals<
          (typeof pathMap)["/"]["get"],
          ParseUrlParams<"/">
        >;
        const validate = locals.validate(req as Request);

        {
          const r = validate.query();
          expect(r.error).toEqual([
            {
              abortEarly: undefined,
              abortPipeEarly: undefined,
              expected: "string",
              input: undefined,
              issues: undefined,
              kind: "schema",
              lang: undefined,
              message: "Invalid type: Expected string but received undefined",
              path: [
                {
                  input: {
                    desc: "test",
                  },
                  key: "name",
                  origin: "value",
                  type: "object",
                  value: undefined,
                },
              ],
              received: "undefined",
              requirement: undefined,
              type: "string",
            },
          ]);
          expect(r.data).toBeUndefined();
        }

        {
          const r = validate.body();
          expect(r.error).toEqual([
            {
              abortEarly: undefined,
              abortPipeEarly: undefined,
              expected: "string",
              input: undefined,
              issues: undefined,
              kind: "schema",
              lang: undefined,
              message: "Invalid type: Expected string but received undefined",
              path: [
                {
                  input: {
                    desc: "test",
                  },
                  key: "name",
                  origin: "value",
                  type: "object",
                  value: undefined,
                },
              ],
              received: "undefined",
              requirement: undefined,
              type: "string",
            },
          ]);
          expect(r.data).toBeUndefined();
        }

        const r = validate.headers();
        expect(r.error).toEqual([
          {
            abortEarly: undefined,
            abortPipeEarly: undefined,
            expected: '"application/json"',
            input: undefined,
            issues: undefined,
            kind: "schema",
            lang: undefined,
            message:
              'Invalid type: Expected "application/json" but received undefined',
            path: [
              {
                input: {},
                key: "content-type",
                origin: "value",
                type: "object",
                value: undefined,
              },
            ],
            received: "undefined",
            requirement: undefined,
            type: "literal",
          },
        ]);
        expect(r.data).toBeUndefined();
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
          route: { path: "/users" },
          method: "get",
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = { locals: {} } as any;
        middleware(req as Request, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.locals.validate).toEqual(expect.any(Function));
        const locals = res.locals as ValibotValidateLocals<
          (typeof pathMap)["/"]["get"],
          ParseUrlParams<"">
        >;
        const validate = locals.validate(req as Request);
        const pathErrorResult = {
          data: undefined,
          error: newValidatorPathNotFoundError("/users"),
        };
        expect(validate.query?.()).toEqual(pathErrorResult);
        expect(validate.body?.()).toEqual(pathErrorResult);
        expect(validate.headers?.()).toEqual(pathErrorResult);
        expect(validate.params?.()).toEqual(pathErrorResult);
      });

      it("have valid path and invalid method", () => {
        const req: Partial<Request> = {
          query: { name: "alice" },
          body: { name: "alice" },
          headers: { "content-type": "application/json" },
          params: { name: "alice" },
          // "/" endpoint is defined but patch method is not defined in pathMap
          route: { path: "/" },
          method: "patch",
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = { locals: {} } as any;
        middleware(req as unknown as Request, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.locals.validate).toEqual(expect.any(Function));
        const locals = res.locals as ValibotValidateLocals<
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          any,
          ParseUrlParams<"">
        >;
        const validate = locals.validate(req as Request);
        const methodErrorResult = {
          data: undefined,
          error: newValidatorMethodNotFoundError("patch"),
        };

        expect(validate.query?.()).toEqual(methodErrorResult);
        expect(validate.body?.()).toEqual(methodErrorResult);
        expect(validate.headers?.()).toEqual(methodErrorResult);
        expect(validate.params?.()).toEqual(methodErrorResult);
      });
    });
  });

  describe("typed", () => {
    const UserId = v.object({ id: v.string() });
    const UserName = v.object({ name: v.string() });
    const User = v.intersect([UserName, UserId]);
    const Err = v.object({ message: v.string() });
    const BadRequest = { 400: Err };
    const pathMap = {
      "/users": {
        get: {
          responses: { 200: { body: v.array(User) } },
        },
        post: {
          body: UserName,
          responses: {
            200: { body: User, ...BadRequest },
            400: { body: Err },
          },
        },
      },
      "/users/:id": {
        get: {
          params: v.object({ id: v.string() }),
          headers: v.object({
            "content-type": v.literal("application/json"),
          }),
          query: v.object({
            detail: v.union([v.literal("true"), v.literal("false")]),
          }),
          responses: {
            200: { body: User, ...BadRequest },
            400: { body: Err },
          },
        },
      },
    } satisfies ValibotApiEndpoints;

    it("ok", async () => {
      const app = newApp();
      const wApp = typed(pathMap, app);
      wApp.get("/users", (req, res) => {
        return res.json([{ id: "1", name: "alice" }]);
      });
      wApp.post("/users", (req, res) => {
        const { data } = res.locals.validate(req).body();
        if (data === undefined) {
          return res.status(400).json({ message: "invalid body" });
        }
        return res.json({ id: "1", name: data.name });
      });
      wApp.get("/users/:id", (req, res) => {
        const qResult = res.locals.validate(req).query();
        const pResult = res.locals.validate(req).params();
        if (pResult.data === undefined) {
          return res.status(400).json({ message: "invalid query" });
        }
        if (qResult.data !== undefined) {
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

  describe("asAsync", () => {
    describe("async handler", () => {
      it("ok", async () => {
        const app = asAsync(newApp());
        app.get("/path", async (req, res) => {
          res.status(200).json({ message: "success" });
        });
        const res = await request(app).get("/path");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "success" });
      });
      it("error", async () => {
        const app = asAsync(newApp());
        app.get("/path", async () => {
          throw new Error("error");
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
        app.use((err: any, req: any, res: any, _next: any) => {
          res.status(501).json({ message: "xxx" });
        });
        const res = await request(app).get("/path");
        expect(res.status).toBe(501);
        expect(res.body).toEqual({ message: "xxx" });
      });
    });
    describe("sync handler", () => {
      it("ok", async () => {
        const app = asAsync(newApp());
        app.get("/path", (req, res) => {
          res.status(200).json({ message: "success" });
        });
        const res = await request(app).get("/path");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "success" });
      });
      it("error", async () => {
        const app = asAsync(newApp());
        app.get("/path", () => {
          throw new Error("error");
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
        app.use((err: any, req: any, res: any, _next: any) => {
          res.status(501).json({ message: "xxx" });
        });
        const res = await request(app).get("/path");
        expect(res.status).toBe(501);
        expect(res.body).toEqual({ message: "xxx" });
      });
    });
  });

  describe("Handler", () => {
    it("ok", async () => {
      const pathMap = {
        "/users": {
          get: {
            params: v.object({ active: v.string() }),
            query: v.object({ name: v.string() }),
            responses: {
              200: {
                body: v.array(
                  v.object({
                    id: v.string(),
                    name: v.string(),
                    active: v.string(),
                  }),
                ),
              },
              400: { body: v.object({ message: v.string() }) },
            },
          },
          post: {
            body: v.object({ name: v.string() }),
            responses: {
              200: {
                body: v.array(v.object({ id: v.string(), name: v.string() })),
              },
              400: { body: v.object({ message: v.string() }) },
            },
          },
        },
      } satisfies ValibotApiEndpoints;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const getHandler: ToHandlers<typeof pathMap>["/users"]["get"] = (
        req,
        res,
      ) => {
        const { data: query, error: queryErr } = res.locals
          .validate(req)
          .query();
        if (queryErr) {
          return res.status(400).json({ message: "invalid query" });
        }
        const { data: params, error: paramsErr } = res.locals
          .validate(req)
          .params();
        if (paramsErr) {
          return res.status(400).json({ message: "invalid params" });
        }
        return res.json([{ id: "1", name: query.name, active: params.active }]);
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const postHandler: ToHandlers<typeof pathMap>["/users"]["post"] = (
        req,
        res,
      ) => {
        const { data: body, error: bodyError } = res.locals
          .validate(req)
          .body();
        if (bodyError) {
          return res.status(400).json({ message: "invalid query" });
        }
        return res.json([{ id: "1", name: body.name }]);
      };
    });
  });
});
