import { Result } from "../utils";
import {
  AnyApiEndpoint,
  AnyApiEndpoints,
  AnyApiSpec,
  AnyResponse,
  ApiSpecRequestKey,
  apiSpecRequestKeys,
  ApiSpecResponseKey,
  apiSpecResponseKeys,
  isMethod,
  Method,
} from "./spec";
import { ParsedQs } from "qs";
import { ZodApiEndpoints, ZodApiSpec, ZodValidators } from "../zod";
import { StatusCode } from "./hono-types";

export type Validators<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ParamsValidator extends AnyValidator | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  QueryValidator extends AnyValidator | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BodyValidator extends AnyValidator | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HeadersValidator extends AnyValidator | undefined,
> = {
  // FIXME: FilterNeverにしたい
  params: ParamsValidator;
  query: QueryValidator;
  body: BodyValidator;
  headers: HeadersValidator;
};
export type AnyValidators = Partial<
  Validators<AnyValidator, AnyValidator, AnyValidator, AnyValidator>
>;
export type ValidatorsMap = {
  [Path in string]: Partial<Record<Method, AnyValidators>>;
};

export const runValidators = (validators: AnyValidators, error: unknown) => {
  const newD = () => Result.data(undefined);
  return {
    preCheck: error,
    params: validators.params?.() ?? newD(),
    query: validators.query?.() ?? newD(),
    body: validators.body?.() ?? newD(),
    headers: validators.headers?.() ?? newD(),
  };
};

export type ResponseValidators<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BodyValidator extends AnyValidator | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HeadersValidator extends AnyValidator | undefined,
> = {
  body: BodyValidator;
  headers: HeadersValidator;
};
export type AnyResponseValidators = Partial<
  ResponseValidators<AnyValidator, AnyValidator>
>;
export const runResponseValidators = (validators: {
  validator: AnyResponseValidators;
  error: unknown;
}) => {
  const newD = () => Result.data(undefined);
  return {
    // TODO: スキーマが間違っていても、bodyのvalidatorがなぜか定義されていない
    preCheck: validators.error,
    body: validators.validator.body?.() ?? newD(),
    headers: validators.validator.headers?.() ?? newD(),
  };
};

export type Validator<Data, Error> = () => Result<Data, Error>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyValidator = Validator<any, any>;

export type ValidatorsInput = {
  path: string;
  method: string;
  params: Record<string, string | string[]>;
  query?: ParsedQs;
  body?: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
};
export type ResponseValidatorsInput = {
  path: string;
  method: string;
  statusCode: number;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
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
    return Result.error(newValidatorPathNotFoundError(path));
  }
  return Result.data(path as keyof E & Path);
};

const validateMethod = <Endpoint extends AnyApiEndpoint, M extends string>(
  endpoint: Endpoint,
  method: M & Method,
): Result<keyof Endpoint & M, ValidationError> => {
  return endpoint[method] === undefined
    ? Result.error(newValidatorMethodNotFoundError(method))
    : Result.data(method);
};

const validatePathAndMethod = <
  E extends AnyApiEndpoints,
  Path extends string,
  M extends string & Method,
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
  M extends string & Method,
>(
  endpoints: E,
  maybePath: Path,
  maybeMethod: M,
) => {
  const r = validatePathAndMethod(endpoints, maybePath, maybeMethod);
  return Result.map(r, (d) => endpoints[d.path][d.method]);
};

export const preCheck = <E extends AnyApiEndpoints>(
  endpoints: E,
  path: string,
  maybeMethod: string,
) => {
  const method = maybeMethod?.toLowerCase();
  if (!isMethod(method)) {
    return Result.error(newValidatorMethodNotFoundError(method));
  }
  return getApiSpec(endpoints, path, method);
};

export type ValidatorError =
  | ValidatorMethodNotFoundError
  | ValidatorPathNotFoundError;

export const newValidatorMethodNotFoundError = (method: string) => ({
  target: "method" as const,
  actual: method,
  message: `method does not exist in endpoint` as const,
});
type ValidatorMethodNotFoundError = ReturnType<
  typeof newValidatorMethodNotFoundError
>;
export const newValidatorPathNotFoundError = (path: string) => ({
  target: "path" as const,
  actual: path,
  message: `path does not exist in endpoints` as const,
});
type ValidatorPathNotFoundError = ReturnType<
  typeof newValidatorPathNotFoundError
>;

export const listDefinedRequestApiSpecKeys = <Spec extends AnyApiSpec>(
  spec: Spec,
): ApiSpecRequestKey[] => {
  return apiSpecRequestKeys.filter((key) => spec[key] !== undefined);
};

export const listDefinedResponseApiSpecKeys = <Response extends AnyResponse>(
  res: Response,
): ApiSpecResponseKey[] => {
  return apiSpecResponseKeys.filter((key) => res[key] !== undefined);
};

type RequestValidatorGenerator = (
  spec: AnyApiSpec,
  input: ValidatorsInput,
  key: ApiSpecRequestKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any;
export const createRequestValidator = <E extends AnyApiEndpoints>(
  endpoints: E,
  specValidatorGenerator: RequestValidatorGenerator,
) => {
  return <
    Path extends keyof E & string,
    M extends keyof E[Path] & Method,
    Validator extends E[Path][M] extends ZodApiSpec
      ? ZodValidators<E[Path][M], "">
      : Record<string, never>,
  >(
    input: ValidatorsInput,
  ) => {
    const r = preCheck(endpoints, input.path, input.method);
    if (r.error !== undefined) {
      return { validator: {} as Validator, error: r.error };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validator: Record<string, any> = {};
    const spec = r.data! as AnyApiSpec;
    listDefinedRequestApiSpecKeys(spec).forEach((key) => {
      validator[key] = () => specValidatorGenerator(spec, input, key);
    });
    return { validator, error: null };
  };
};

type ResponseValidatorGenerator = (
  spec: AnyApiSpec,
  input: ResponseValidatorsInput,
  key: ApiSpecResponseKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any;
export const createResponseValidator = <E extends AnyApiEndpoints>(
  endpoints: E,
  resValidatorGenerator: ResponseValidatorGenerator,
) => {
  return <
    Path extends keyof E & string,
    M extends keyof E[Path] & Method,
    Validator extends E[Path][M] extends ZodApiSpec
      ? ZodValidators<E[Path][M], "">
      : Record<string, never>,
  >(
    input: ResponseValidatorsInput,
  ) => {
    const r = preCheck(endpoints, input.path, input.method);
    if (r.error !== undefined) {
      return { validator: {} as Validator, error: r.error };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validator: Record<string, any> = {};
    const spec = r.data! as AnyApiSpec;
    const response = spec?.responses?.[input.statusCode as StatusCode] ?? {};
    listDefinedResponseApiSpecKeys(response).forEach((key) => {
      validator[key] = () => resValidatorGenerator(spec, input, key);
    });
    return { validator, error: null };
  };
};

export const createValidator = <E extends ZodApiEndpoints>(
  endpoints: E,
  reqV: RequestValidatorGenerator,
  resV: ResponseValidatorGenerator,
) => {
  const req = createRequestValidator<typeof endpoints>(endpoints, reqV);
  const res = createResponseValidator<typeof endpoints>(endpoints, resV);
  return { req, res };
};
