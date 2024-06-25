import {
  ApiEndpoints,
  ApiP,
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
  HeadersObj extends Record<string, string> | undefined,
> extends RequestInit {
  method?: InputMethod;
  body?: TypedString<Body>;
  // FIXME: no optional
  headers?: HeadersObj extends Record<string, string>
    ? HeadersObj | Headers
    : never;
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
  init?: RequestInitT<
    InputMethod,
    ApiP<E, CandidatePaths, M, "body">,
    ApiP<E, CandidatePaths, M, "reqHeaders">
  >,
  // FIXME: NonNullable
) => Promise<MergeApiResponses<NonNullable<E[CandidatePaths][M]>["res"]>>;

export default FetchT;
