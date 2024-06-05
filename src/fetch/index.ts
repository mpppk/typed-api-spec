import { MergeApiResponses, Method } from "../common";
import {
  MatchedPatterns,
  OriginPattern,
  ParseURL,
  ToUrlParamPattern,
} from "../common";
import { TypedString } from "../json";
import { InferOrUndefined, ZodApiBodySchema, ZodApiEndpoints } from "../zod";

export interface RequestInitT<
  M extends Method,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Body extends Record<string, any> | undefined,
> extends RequestInit {
  method?: M;
  body?: TypedString<Body>;
}

type FetchT<Origin extends OriginPattern, E extends ZodApiEndpoints> = <
  Input extends
    | `${Origin}${ToUrlParamPattern<keyof E & string>}`
    | `${Origin}${ToUrlParamPattern<keyof E & string>}?${string}`,
  InputPath extends ParseURL<Input>["path"],
  CandidatePaths extends MatchedPatterns<E, InputPath>,
  M extends Method = "get",
>(
  input: Input,
  init?: RequestInitT<
    M,
    InferOrUndefined<ZodApiBodySchema<E, CandidatePaths, M>>
  >,
  // FIXME: NonNullable
) => Promise<MergeApiResponses<NonNullable<E[CandidatePaths][M]>["res"]>>;

export default FetchT;