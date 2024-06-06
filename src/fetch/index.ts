import {
  ApiBodySchema,
  ApiEndpoints,
  MergeApiResponses,
  Method,
  Replace,
} from "../common";
import {
  MatchedPatterns,
  OriginPattern,
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

type FetchT<Origin extends OriginPattern, E extends ApiEndpoints> = <
  Input extends
    | `${ToUrlParamPattern<Origin>}${ToUrlParamPattern<keyof E & string>}`
    | `${ToUrlParamPattern<Origin>}${ToUrlParamPattern<keyof E & string>}?${string}`,
  InputPath extends Replace<
    ParseURL<Input>["path"],
    ToUrlParamPattern<Origin>,
    ""
  >,
  CandidatePaths extends MatchedPatterns<E, InputPath>,
  M extends Method = "get",
>(
  input: Input,
  init?: RequestInitT<M, ApiBodySchema<E, CandidatePaths, M>>,
  // FIXME: NonNullable
) => Promise<MergeApiResponses<NonNullable<E[CandidatePaths][M]>["res"]>>;

export default FetchT;
