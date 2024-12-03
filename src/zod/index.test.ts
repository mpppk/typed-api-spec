import { describe, it, expect } from "vitest";
import { z, ZodError } from "zod";
import { newZodValidator, ZodApiEndpoints } from "./index";
import { AnyResponseValidators, AnyValidators } from "../core/validate";

describe("newZodValidator", () => {
  const pathMap = {
    "/": {
      get: {
        query: z.object({ queryName: z.string() }),
        body: z.object({ bodyName: z.string() }),
        headers: z.object({ headersName: z.string() }),
        params: z.object({ paramsName: z.string() }),
        responses: {
          200: {
            body: z.object({ bodyNameRes: z.string() }),
            headers: z.object({ headersNameRes: z.string() }),
          },
        },
      },
    },
  } satisfies ZodApiEndpoints;

  const validReqInput = {
    path: "/",
    method: "get",
    params: { paramsName: "paramsName" },
    query: { queryName: "queryName" },
    body: { bodyName: "bodyName" },
    headers: { headersName: "headersName" },
  };

  const validResInput = {
    path: "/",
    method: "get",
    statusCode: 200,
    body: { bodyNameRes: "bodyNameRes" },
    headers: { headersNameRes: "headersNameRes" },
  };

  it("ok", () => {
    const { req, res } = newZodValidator(pathMap);
    const { validator: reqV, error } = req(validReqInput);
    expect(error).toBeNull();
    expect(reqV["query"]()).toEqual({ data: { queryName: "queryName" } });
    expect(reqV["params"]()).toEqual({ data: { paramsName: "paramsName" } });
    expect(reqV["body"]()).toEqual({ data: { bodyName: "bodyName" } });
    expect(reqV["headers"]()).toEqual({ data: { headersName: "headersName" } });

    const { validator: resV, error: resE } = res(validResInput);
    expect(resE).toBeNull();
    expect(resV["body"]()).toEqual({ data: { bodyNameRes: "bodyNameRes" } });
    expect(resV["headers"]()).toEqual({
      data: { headersNameRes: "headersNameRes" },
    });
  });

  const checkZodError = (error: ZodError, path: string) => {
    expect(error).toBeInstanceOf(ZodError);
    expect(error.issues).toHaveLength(1);
    expect(error.issues[0]).toEqual({
      code: "invalid_type",
      expected: "string",
      received: "undefined",
      path: [path],
      message: "Required",
    });
  };

  describe("invalid request input", () => {
    const { req } = newZodValidator(pathMap);
    const keys: (keyof AnyValidators)[] = [
      "query",
      "params",
      "body",
      "headers",
    ];
    it.each(keys)("%s", (key) => {
      const { validator: reqV, error } = req({
        ...validReqInput,
        [key]: { invalid: "invalidValue" },
      });
      expect(error).toBeNull();
      const { data, error: error2 } = reqV[key]();
      expect(data).toBeUndefined();
      checkZodError(error2, `${key}Name`);
    });
  });
  describe("invalid response input", () => {
    const { res } = newZodValidator(pathMap);
    const keys: (keyof AnyResponseValidators)[] = ["body", "headers"];
    it.each(keys)("%s", (key) => {
      const { validator: reqV, error } = res({
        ...validResInput,
        [key]: { invalid: "invalidValue" },
      });
      expect(error).toBeNull();
      const { data, error: error2 } = reqV[key]();
      expect(data).toBeUndefined();
      checkZodError(error2, `${key}NameRes`);
    });
  });
});
