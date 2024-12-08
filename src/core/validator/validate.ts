import { Result } from "../../utils";
import {
  AnyApiEndpoint,
  AnyApiEndpoints,
  isMethod,
  Method,
  MethodInvalidError,
  newMethodInvalidError,
} from "../spec";
import {
  createResponseValidator,
  ResponseValidatorGenerator,
} from "./response";
import {
  createRequestValidator,
  RequestValidatorGenerator,
  ValidatorsInput,
} from "./request";

export type Validator<Data, Error> = () => Result<Data, Error>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyValidator = Validator<any, any>;

export const checkValidatorsInput = <
  E extends AnyApiEndpoints,
  Path extends keyof E & string,
  M extends keyof E[Path] & Method,
>(
  endpoints: E,
  input: { path: string; method: string },
): Result<ValidatorsInput<Path, M>, ValidatorInputError> => {
  const method = input.method.toLowerCase();
  if (!isMethod(method)) {
    return Result.error(newMethodInvalidError(method));
  }
  const { error: pathE } = validatePath(endpoints, input.path);
  if (pathE) {
    return Result.error(pathE);
  }
  const { error: methodE } = validateMethod(endpoints[input.path], method);
  if (methodE) {
    return Result.error(methodE);
  }
  return Result.data(input as ValidatorsInput<Path, M>);
};

export const validatePath = <E extends AnyApiEndpoints, Path extends string>(
  endpoints: E,
  path: Path,
): Result<keyof E & Path, ValidatorInputPathNotFoundError> => {
  if (!(path in endpoints)) {
    return Result.error(newValidatorPathNotFoundError(path));
  }
  return Result.data(path as keyof E & Path);
};

export const validateMethod = <
  Endpoint extends AnyApiEndpoint,
  M extends string,
>(
  endpoint: Endpoint,
  method: M & Method,
): Result<keyof Endpoint & M, ValidatorInputMethodNotFoundError> => {
  return endpoint[method] === undefined
    ? Result.error(newValidatorMethodNotFoundError(method))
    : Result.data(method);
};

export type ValidatorInputError =
  | MethodInvalidError
  | ValidatorInputMethodNotFoundError
  | ValidatorInputPathNotFoundError;

export const newValidatorMethodNotFoundError = (method: string) => ({
  target: "method" as const,
  actual: method,
  message: `method does not exist in endpoint` as const,
});
type ValidatorInputMethodNotFoundError = ReturnType<
  typeof newValidatorMethodNotFoundError
>;
export const newValidatorPathNotFoundError = (path: string) => ({
  target: "path" as const,
  actual: path,
  message: `path does not exist in endpoints` as const,
});
type ValidatorInputPathNotFoundError = ReturnType<
  typeof newValidatorPathNotFoundError
>;

export const createValidator = <E extends AnyApiEndpoints>(
  endpoints: E,
  reqV: RequestValidatorGenerator,
  resV: ResponseValidatorGenerator,
) => {
  const req = createRequestValidator<typeof endpoints>(endpoints, reqV);
  const res = createResponseValidator<typeof endpoints>(endpoints, resV);
  return { req, res };
};
