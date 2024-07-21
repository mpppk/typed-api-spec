import { Result } from "../utils";
import { AnyApiEndpoint, AnyApiEndpoints, isMethod } from "./spec";

export type ValidatorsInput = {
  path: string;
  method: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: Record<string, string>;
  headers: Record<string, string>;
};

type ValidationError = {
  actual: string;
  message: string;
};
const validatePath = <E extends AnyApiEndpoints, Path extends string>(
  endpoints: E,
  path: Path,
): Result<keyof E & Path, ValidationError> => {
  if (!(path in endpoints)) {
    return Result.error({
      actual: path,
      message: `path does not exist in endpoints`,
    });
  }
  return Result.data(path as keyof E & Path);
};

const validateMethod = <Endpoint extends AnyApiEndpoint, M extends string>(
  endpoint: Endpoint,
  method: M,
): Result<keyof Endpoint & M, ValidationError> => {
  if (!isMethod(method)) {
    return Result.error({
      target: "method",
      actual: method,
      message: `invalid method`,
    });
  }
  if (endpoint[method] === undefined) {
    return Result.error({
      target: "method",
      actual: method,
      message: `method does not exist in endpoint`,
    });
  }
  return Result.data(method);
};

const validatePathAndMethod = <
  E extends AnyApiEndpoints,
  Path extends string,
  M extends string,
>(
  endpoints: E,
  maybePath: Path,
  maybeMethod: M,
): Result<
  { method: keyof E[Path] & M; path: keyof E & Path },
  ValidationError
> => {
  const r = validatePath(endpoints, maybePath);
  return Result.andThen(r, (path) => {
    const mr = validateMethod(endpoints[path], maybeMethod);
    return Result.map(mr, (method) => ({ method, path }));
  });
};

export const getApiSpec = <
  E extends AnyApiEndpoints,
  Path extends string,
  M extends string,
>(
  endpoints: E,
  maybePath: Path,
  maybeMethod: M,
) => {
  const r = validatePathAndMethod(endpoints, maybePath, maybeMethod);
  return Result.map(r, (d) => endpoints[d.path][d.method]);
};
