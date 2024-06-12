import {
  ApiBodySchema,
  ApiEndpoints,
  CaseInsensitiveMethod,
  MergeApiResponses,
  Method,
  NormalizePath,
  Replace,
} from "../common";
import {
  MatchedPatterns,
  UrlPrefixPattern,
  ParseURL,
  ToUrlParamPattern,
} from "../common";
import { TypedString } from "../json";

export interface RequestInitT<
  InputMethod extends CaseInsensitiveMethod,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Body extends Record<string, any> | undefined,
> extends RequestInit {
  method?: InputMethod;
  body?: TypedString<Body>;
}

/**
 * FetchT is a type for window.fetch like function but more strict type information
 */
type FetchT<Origin extends UrlPrefixPattern, E extends ApiEndpoints> = <
  Input extends
    | `${ToUrlParamPattern<Origin>}${ToUrlParamPattern<keyof E & string>}`
    | `${ToUrlParamPattern<Origin>}${ToUrlParamPattern<keyof E & string>}?${string}`,
  InputPath extends Replace<
    NormalizePath<ParseURL<Input>["path"]>,
    ToUrlParamPattern<Origin>,
    ""
  >,
  CandidatePaths extends MatchedPatterns<InputPath, keyof E & string>,
  InputMethod extends CaseInsensitiveMethod = "get",
  M extends Method = Lowercase<InputMethod>,
>(
  input: Input,
  init?: RequestInitT<InputMethod, ApiBodySchema<E, CandidatePaths, M>>,
  // FIXME: NonNullable
) => Promise<MergeApiResponses<NonNullable<E[CandidatePaths][M]>["res"]>>;

export default FetchT;
