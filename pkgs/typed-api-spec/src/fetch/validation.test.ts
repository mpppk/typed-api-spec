import { withValidation } from "./validation";
import { describe, it, expect, vi } from "vitest";
import { newZodValidator, ZodApiEndpoints } from "../zod";
import { z } from "zod";
import { toLCObj } from "../utils";

const newFetch = (
  body: Record<string, string>,
  headers: Record<string, string>,
) => {
  return vi.fn(
    () => new Response(JSON.stringify(body), { headers: toLCObj(headers) }),
  ) as unknown as typeof fetch;
};
describe("withValidation", () => {
  const pathMap = {
    "/:paramsName": {
      get: {
        query: z.object({ queryName: z.string() }),
        headers: z.object(toLCObj({ headersName: z.string() })),
        params: z.object({ paramsName: z.string() }),
        responses: {
          200: {
            body: z.object({ bodyNameRes: z.string() }),
            headers: z.object(toLCObj({ headersNameRes: z.string() })),
          },
          400: { body: z.object({ message: z.string() }) },
        },
      },
      post: {
        body: z.object({ bodyName: z.string() }),
        responses: { 200: { body: z.object({ bodyNameRes: z.string() }) } },
      },
    },
  } satisfies ZodApiEndpoints;
  const path = "/p?queryName=q";
  describe("invalid request", () => {
    const ft = newFetch({ bodyNameRes: "b" }, { headersNameRes: "h" });
    const { req, res } = newZodValidator(pathMap);
    const fetchV = withValidation(ft, pathMap, req, res);
    it("query", async () => {
      await expect(() =>
        fetchV("/p", { headers: { headersName: "h" } }),
      ).rejects.toThrow(
        '{"reason":"query","issues":[{"code":"invalid_type","expected":"string","received":"undefined","path":["queryName"],"message":"Required"}],"name":"ZodError"}',
      );
    });
    it("headers", async () => {
      await expect(() => fetchV(path, { headers: {} })).rejects.toThrow(
        '{"reason":"headers","issues":[{"code":"invalid_type","expected":"string","received":"undefined","path":["headersname"],"message":"Required"}],"name":"ZodError"}',
      );
    });
    it("body", async () => {
      await expect(() =>
        fetchV(path, {
          method: "post",
          body: "{}",
          headers: { headersName: "h" },
        }),
      ).rejects.toThrow(
        '{"reason":"body","issues":[{"code":"invalid_type","expected":"string","received":"undefined","path":["bodyName"],"message":"Required"}],"name":"ZodError"}',
      );
    });
  });
  describe("status code 200", () => {
    it("valid response", async () => {
      const ft = newFetch({ bodyNameRes: "b" }, { headersNameRes: "h" });
      const { req, res } = newZodValidator(pathMap);
      const fetchV = withValidation(ft, pathMap, req, res);
      const r = await fetchV(path, { headers: { headersName: "h" } });
      expect(await r.json()).toEqual({ bodyNameRes: "b" });
    });
    describe("invalid response", () => {
      it("body", async () => {
        const ft = newFetch({ invalid: "invalid" }, { headersNameRes: "h" });
        const { req, res } = newZodValidator(pathMap);
        const fetchV = withValidation(ft, pathMap, req, res);
        await expect(() =>
          fetchV(path, { headers: { headersName: "h" } }),
        ).rejects.toThrow(
          '{"reason":"body","issues":[{"code":"invalid_type","expected":"string","received":"undefined","path":["bodyNameRes"],"message":"Required"}],"name":"ZodError"}',
        );
      });
      it("headers", async () => {
        const ft = newFetch({ bodyNameRes: "b" }, { invalid: "invalid" });
        const { req, res } = newZodValidator(pathMap);
        const fetchV = withValidation(ft, pathMap, req, res);
        await expect(() =>
          fetchV(path, { headers: { headersName: "h" } }),
        ).rejects.toThrow(
          '{"reason":"headers","issues":[{"code":"invalid_type","expected":"string","received":"undefined","path":["headersnameres"],"message":"Required"}],"name":"ZodError"}',
        );
      });
    });
  });
  describe("status code 400", () => {
    it("valid response", async () => {
      const ft = newFetch({ message: "m" }, { headersNameRes: "h" });
      const { req, res } = newZodValidator(pathMap);
      const fetchV = withValidation(ft, pathMap, req, res);
      const r = await fetchV(path, { headers: { headersName: "h" } });
      expect(await r.json()).toEqual({ message: "m" });
    });
  });
});
