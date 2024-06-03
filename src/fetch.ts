import {
  ApiBodySchema,
  ApiEndpoints,
  ApiResponses,
  ApiResSchema,
  InferOrUndefined,
  Method,
} from "./spec";
import { StatusCode, ClientResponse } from "./hono-types";
import { z } from "zod";
import {
  MatchedPatterns,
  OriginPattern,
  ParseURL,
  ToUrlParamPattern,
} from "./url";
import { TypedString } from "./json";

interface TRequestInit<
  M extends Method,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Body extends Record<string, any> | undefined,
> extends RequestInit {
  method?: M;
  body?: TypedString<Body>;
}

type ApiClientResponses<AResponses extends ApiResponses> = {
  [SC in keyof AResponses & StatusCode]: ClientResponse<
    z.infer<ApiResSchema<AResponses, SC>>,
    SC,
    "json"
  >;
};
export type MergeApiResponses<AR extends ApiResponses> =
  ApiClientResponses<AR>[keyof ApiClientResponses<AR>];

export type TFetch<Origin extends OriginPattern, E extends ApiEndpoints> = <
  Input extends
    | `${Origin}${ToUrlParamPattern<keyof E & string>}`
    | `${Origin}${ToUrlParamPattern<keyof E & string>}?${string}`,
  InputPath extends ParseURL<Input>["path"],
  CandidatePaths extends MatchedPatterns<E, InputPath>,
  M extends Method = "get",
>(
  input: Input,
  init?: TRequestInit<M, InferOrUndefined<ApiBodySchema<E, CandidatePaths, M>>>,
  // FIXME: NonNullable
) => Promise<MergeApiResponses<NonNullable<E[CandidatePaths][M]>["res"]>>;
