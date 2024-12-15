import { memoize, Result, tupleIteratorToObject, unreachable } from "../utils";
import { match } from "path-to-regexp";
import { UnknownApiEndpoints } from "../core";
import {
  AnySpecValidator,
  RequestSpecValidatorGenerator,
  runSpecValidator,
} from "../core";
import {
  AnyResponseSpecValidator,
  ResponseSpecValidatorGenerator,
  runResponseSpecValidator,
} from "../core";
import { ValidatorInputError } from "../core";

const dummyHost = "https://example.com";

// https://blog.jxck.io/entries/2024-06-14/url.parse.html
function parseURL(str: string) {
  try {
    return new URL(str, dummyHost);
  } catch (err) {
    return null;
  }
}

const headersToRecord = (headers: HeadersInit): Record<string, string> => {
  const result: Record<string, string> = {};
  const headersObj = new Headers(headers);
  headersObj.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

type MatchResult = {
  matched: string;
  params: Record<string, string | string[]>;
};
const newPathMather = <E extends Record<string, unknown>>(endpoints: E) => {
  const mMatch = memoize(match);
  return (path: string) => {
    // FIXME matchedはendpointsのkeys
    const ret: MatchResult[] = [];
    for (const definedPath of Object.keys(endpoints)) {
      const result = mMatch(definedPath)(path);
      if (!result) {
        continue;
      }
      ret.push({
        matched: definedPath,
        // TODO: こんな適当にキャストしていいんだっけ?
        params: result.params as Record<string, string | string[]>,
      });
    }
    return ret;
  };
};

const toInput =
  (matcher: (p: string) => MatchResult[]) =>
  <Fetch extends typeof fetch>(...args: Parameters<Fetch>) => {
    const [input, init] = args;
    const url = parseURL(input.toString());
    const candidatePaths = matcher(url?.pathname ?? "");
    const cp = candidatePaths[0] ?? { matched: "", params: {} };
    const query = tupleIteratorToObject(url?.searchParams?.entries() ?? []);

    return {
      path: cp.matched,
      method: init?.method?.toLowerCase() ?? "get",
      headers: headersToRecord(init?.headers ?? {}),
      params: cp.params,
      // FIXME: JSON APIじゃない時どうするか
      body: init?.body ? JSON.parse(init.body.toString()) : undefined,
      query,
    };
  };

const newErrorHandler = (policy: "throw" | "log") => {
  return (
    results: ReturnType<typeof runSpecValidator>,
    error: ValidatorInputError | undefined,
  ) => {
    switch (policy) {
      case "throw":
        if (error) {
          console.log(error);
          throw new SpecValidatorError("preCheck", error);
        }
        handleValidatorsError(results, (reason, error) => {
          throw new SpecValidatorError(reason, error);
        });
        break;
      case "log":
        if (error) {
          console.error(new SpecValidatorError("preCheck", error));
        }
        handleValidatorsError(results, (reason, error) => {
          console.error(new SpecValidatorError(reason, error));
        });
        break;
      default:
        unreachable(policy);
    }
  };
};
const newResponseErrorHandler = (policy: "throw" | "log") => {
  return (results: ReturnType<typeof runResponseSpecValidator>) => {
    switch (policy) {
      case "throw":
        handleResponseValidatorsError(results, (reason, error) => {
          throw new SpecValidatorError(reason, error);
        });
        break;
      case "log":
        handleResponseValidatorsError(results, (reason, error) => {
          console.error(new SpecValidatorError(reason, error));
        });
        break;
      default:
        unreachable(policy);
    }
  };
};

export const withValidation = <
  Fetch extends typeof fetch,
  Validators extends RequestSpecValidatorGenerator,
  ResponseValidators extends ResponseSpecValidatorGenerator,
  Endpoints extends UnknownApiEndpoints,
>(
  f: Fetch,
  endpoints: Endpoints,
  validatorGenerator: Validators,
  responseValidatorGenerator: ResponseValidators,
  options: { policy: "throw" | "log" } = { policy: "throw" },
): Fetch => {
  const toInputWithMatcher = toInput(newPathMather(endpoints));
  const handleError = newErrorHandler(options.policy);
  const handleResponseError = newResponseErrorHandler(options.policy);
  const ftc = async (...args: Parameters<Fetch>) => {
    const [input, init] = args;
    const vInput = toInputWithMatcher(input, init);
    const { data: validator, error } = validatorGenerator(vInput);
    handleError(runSpecValidator(validator), error);
    const res = await f(input, init);
    const res1 = res.clone();
    // TODO: jsonじゃない時どうするか
    // TODO: response bodyを直接渡すのはおかしい
    const headers: Record<string, string> = {};
    res1.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const responseValidator = responseValidatorGenerator({
      path: vInput.path,
      method: vInput.method,
      statusCode: res1.status,
      body: await res1.json(),
      headers: headersToRecord(res1.headers ?? {}),
    });
    handleResponseError(runResponseSpecValidator(responseValidator));
    return res;
  };
  return ftc as Fetch;
};

export class SpecValidatorError extends Error {
  constructor(
    public reason: keyof AnySpecValidator | "preCheck",
    public error: ValidatorInputError,
    public message: string = JSON.stringify({ reason, ...error }),
  ) {
    super("Validation error");
  }
}

const handleValidatorsError = (
  results: Record<
    Exclude<keyof AnySpecValidator, "responses">,
    Result<unknown, ValidatorInputError>
  >,
  cb: (reason: keyof AnySpecValidator, error: ValidatorInputError) => void,
) => {
  if (results.params?.error) {
    cb("params", results.params.error);
  }
  if (results.query?.error) {
    cb("query", results.query.error);
  }
  if (results.body?.error) {
    cb("body", results.body.error);
  }
  if (results.headers?.error) {
    cb("headers", results.headers.error);
  }
};

const handleResponseValidatorsError = (
  results: Record<
    Exclude<keyof AnyResponseSpecValidator, "responses">,
    Result<unknown, ValidatorInputError>
  >,
  cb: (reason: keyof AnySpecValidator, error: ValidatorInputError) => void,
) => {
  if (results.body?.error) {
    cb("body", results.body.error);
  }
  if (results.headers?.error) {
    cb("headers", results.headers.error);
  }
};
