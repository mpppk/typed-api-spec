import { describe, it, expect } from "vitest";
import { getApiSpec } from "./validate";
import { AnyApiEndpoints } from "./spec";
describe("getApiSpec", () => {
  const spec: AnyApiEndpoints = {
    "/users": {
      get: {
        responses: { 200: { description: "ok" } },
      },
    },
  };
  it("should return path and method if valid path and method provided", () => {
    const { data, error } = getApiSpec(spec, "/users", "get");
    expect(data).toEqual({ responses: { 200: { description: "ok" } } });
    expect(error).toBeUndefined();
  });
  it("should return error if invalid path provided", () => {
    const { data, error } = getApiSpec(spec, "", "get");
    expect(data).toBeUndefined();
    expect(error).toEqual({
      actual: "",
      message: "path does not exist in endpoints",
    });
  });
  it("should return error if no exist method provided", () => {
    const { data, error } = getApiSpec(spec, "/users", "post");
    expect(data).toBeUndefined();
    expect(error).toEqual({
      actual: "post",
      message: "method does not exist in endpoint",
      target: "method",
    });
  });
});
