import {
  AnyApiEndpoints,
  AnyApiSpec,
  ApiSpecRequestKey,
  apiSpecRequestKeys,
  Method,
} from "../spec";
import { Result } from "../../utils";
import {
  AnyValidator,
  checkValidatorsInput,
  ValidatorInputError,
} from "./validate";
import { ParsedQs } from "qs";

export const listDefinedRequestApiSpecKeys = <Spec extends AnyApiSpec>(
  spec: Spec,
): ApiSpecRequestKey[] => {
  return apiSpecRequestKeys.filter((key) => spec[key] !== undefined);
};

export type Validators<
  ParamsValidator extends AnyValidator | undefined,
  QueryValidator extends AnyValidator | undefined,
  BodyValidator extends AnyValidator | undefined,
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

export type ValidatorsRawInput<Path extends string, Method extends string> = {
  path: Path;
  method: Method;
  params: Record<string, string | string[]>;
  query?: ParsedQs;
  body?: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
};
export type ValidatorsInput<Path extends string, M extends Method> = {
  path: Path;
  method: M;
  params: Record<string, string | string[]>;
  query?: ParsedQs;
  body?: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
};

export const runValidators = (
  validators: AnyValidators | undefined,
  error: unknown,
) => {
  const newD = () => Result.data(undefined);
  return {
    preCheck: error,
    params: validators?.params?.() ?? newD(),
    query: validators?.query?.() ?? newD(),
    body: validators?.body?.() ?? newD(),
    headers: validators?.headers?.() ?? newD(),
  };
};

export type RequestValidator = (
  input: ValidatorsRawInput<string, string>,
) => Result<AnyValidators, ValidatorInputError>;
export type RequestValidatorGenerator = (
  spec: AnyApiSpec,
  input: ValidatorsInput<string, Method>,
  key: ApiSpecRequestKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any;
export const createRequestValidator = <E extends AnyApiEndpoints>(
  endpoints: E,
  specValidatorGenerator: RequestValidatorGenerator,
): RequestValidator => {
  return (
    input: ValidatorsRawInput<string, string>,
  ): Result<AnyValidators, ValidatorInputError> => {
    const { data: vInput, error } = checkValidatorsInput(endpoints, input);
    if (error) {
      return Result.error(error);
    }
    const validators: AnyValidators = {};
    const spec = endpoints[vInput.path][vInput.method]!;
    listDefinedRequestApiSpecKeys(spec).forEach((key) => {
      validators[key] = () => specValidatorGenerator(spec, vInput, key);
    });
    return Result.data(validators);
  };
};
