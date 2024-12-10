import {
  AnyApiEndpoints,
  AnyApiSpec,
  AnyResponse,
  ApiSpecResponseKey,
  apiSpecResponseKeys,
  Method,
} from "../spec";
import { StatusCode } from "../hono-types";
import { Result } from "../../utils";
import {
  AnyValidator,
  checkValidatorsInput,
  ValidatorInputError,
} from "./validate";
import { AnyValidators } from "./request";

export const listDefinedResponseApiSpecKeys = <Response extends AnyResponse>(
  res: Response,
): ApiSpecResponseKey[] => {
  return apiSpecResponseKeys.filter((key) => res[key] !== undefined);
};

export type ResponseValidator = (
  input: ResponseValidatorsRawInput<string, string, number>,
) => Result<AnyResponseValidators, ValidatorInputError>;
export type ResponseValidatorGenerator = (
  spec: AnyApiSpec,
  input: ResponseValidatorsInput<string, Method, StatusCode>,
  key: ApiSpecResponseKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any;
export const createResponseValidator = <E extends AnyApiEndpoints>(
  endpoints: E,
  resValidatorGenerator: ResponseValidatorGenerator,
) => {
  return <Validators extends AnyValidators>(
    input: ResponseValidatorsInput<string, Method, StatusCode>,
  ): Result<Validators, ValidatorInputError> => {
    const { data: vInput, error } = checkValidatorsInput(endpoints, input);
    if (error) {
      return Result.error(error);
    }
    const validator: AnyValidators = {};
    const spec = endpoints[vInput.path][vInput.method]!;
    // const spec = r.data! as AnyApiSpec;
    const response = spec?.responses?.[input.statusCode as StatusCode] ?? {};
    listDefinedResponseApiSpecKeys(response).forEach((key) => {
      validator[key] = () => resValidatorGenerator(spec, input, key);
    });
    return Result.data(validator as Validators);
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
export const runResponseValidators = (
  r: Result<AnyResponseValidators, ValidatorInputError>,
) => {
  const newD = () => Result.data(undefined);
  return {
    // TODO: スキーマが間違っていても、bodyのvalidatorがなぜか定義されていない
    preCheck: r.error,
    body: r.data?.body?.() ?? newD(),
    headers: r.data?.headers?.() ?? newD(),
  };
};

export type ResponseValidatorsRawInput<
  Path extends string,
  M extends string,
  SC extends number,
> = {
  path: Path;
  method: M;
  statusCode: SC;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};
export type ResponseValidatorsInput<
  Path extends string,
  M extends Method,
  SC extends StatusCode,
> = {
  path: Path;
  method: M;
  statusCode: SC;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};
