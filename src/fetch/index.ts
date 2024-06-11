import {
  ApiBodySchema,
  ApiEndpoints,
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
  M extends Method,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Body extends Record<string, any> | undefined,
> extends RequestInit {
  method?: M;
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
  M extends Method = "get",
>(
  input: Input,
  init?: RequestInitT<M, ApiBodySchema<E, CandidatePaths, M>>,
  // FIXME: NonNullable
) => Promise<MergeApiResponses<NonNullable<E[CandidatePaths][M]>["res"]>>;

export default FetchT;
