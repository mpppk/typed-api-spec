import { describe, it, expect } from "vitest";
import { newValibotValidator, ValibotApiEndpoints } from "./index";
import * as v from "valibot";
import {
  newValidatorMethodNotFoundError,
  newValidatorPathNotFoundError,
} from "../core/validator/validate";
import { InferIssue } from "valibot";
import { AnyResponseValidators } from "../core/validator/response";
import { AnyValidators } from "../core/validator/request";

describe("newValibotValidator", () => {
  const pathMap = {
    "/": {
      get: {
        query: v.object({ queryName: v.string() }),
        body: v.object({ bodyName: v.string() }),
        headers: v.object({ headersName: v.string() }),
        params: v.object({ paramsName: v.string() }),
        responses: {
          200: {
            body: v.object({ bodyNameRes: v.string() }),
            headers: v.object({ headersNameRes: v.string() }),
          },
        },
      },
    },
  } satisfies ValibotApiEndpoints;

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
    const { req, res } = newValibotValidator(pathMap);
    const { data: reqV, error } = req(validReqInput);
    expect(error).toBeNull();
    if (error !== undefined) {
      return;
    }
    expect(reqV["query"]()).toEqual({ data: { queryName: "queryName" } });
    expect(reqV["params"]()).toEqual({ data: { paramsName: "paramsName" } });
    expect(reqV["body"]()).toEqual({ data: { bodyName: "bodyName" } });
    expect(reqV["headers"]()).toEqual({ data: { headersName: "headersName" } });

    const { data: resV, error: resE } = res(validResInput);
    expect(resE).toBeNull();
    expect(resV["body"]()).toEqual({ data: { bodyNameRes: "bodyNameRes" } });
    expect(resV["headers"]()).toEqual({
      data: { headersNameRes: "headersNameRes" },
    });
  });

  const checkValibotError = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    issues: [InferIssue<any>, ...InferIssue<any>[]],
    path: string,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
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
            invalid: "invalidValue",
          },
          key: path,
          origin: "value",
          type: "object",
          value: undefined,
        },
      ],
      received: "undefined",
      requirement: undefined,
      type: "string",
    });
  };

  describe("invalid request input", () => {
    const { req } = newValibotValidator(pathMap);
    const keys: (keyof AnyValidators)[] = [
      "query",
      "params",
      "body",
      "headers",
    ];
    it.each(keys)("%s", (key) => {
      const { data: reqV, error } = req({
        ...validReqInput,
        [key]: { invalid: "invalidValue" },
      });
      expect(error).toBeNull();
      const { data, error: error2 } = reqV[key]();
      expect(data).toBeUndefined();
      checkValibotError(error2, `${key}Name`);
    });
  });
  describe("invalid response input", () => {
    const { res } = newValibotValidator(pathMap);
    const keys: (keyof AnyResponseValidators)[] = ["body", "headers"];
    it.each(keys)("%s", (key) => {
      const { data: reqV, error } = res({
        ...validResInput,
        [key]: { invalid: "invalidValue" },
      });
      expect(error).toBeNull();
      const { data, error: error2 } = reqV[key]();
      expect(data).toBeUndefined();
      checkValibotError(error2, `${key}NameRes`);
    });
  });

  describe("invalid validator input", () => {
    describe("method", () => {
      const method = "noexist-method";
      it("request", () => {
        const { req } = newValibotValidator(pathMap);
        const { validator, error } = req({ ...validReqInput, method });
        expect(validator).toEqual({});
        expect(error).toEqual(newValidatorMethodNotFoundError(method));
      });

      it("response", () => {
        const { res } = newValibotValidator(pathMap);
        const { validator, error } = res({ ...validResInput, method });
        expect(validator).toEqual({});
        expect(error).toEqual(newValidatorMethodNotFoundError(method));
      });
    });
    describe("path", () => {
      const path = "noexist-path";
      it("request", () => {
        const { req } = newValibotValidator(pathMap);
        const { validator, error } = req({ ...validReqInput, path });
        expect(validator).toEqual({});
        expect(error).toEqual(newValidatorPathNotFoundError(path));
      });

      it("response", () => {
        const { res } = newValibotValidator(pathMap);
        const { validator, error } = res({ ...validResInput, path });
        expect(validator).toEqual({});
        expect(error).toEqual(newValidatorPathNotFoundError(path));
      });
    });
  });
});
