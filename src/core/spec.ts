import { ParseUrlParams } from "./url";
import { ClientResponse, StatusCode } from "./hono-types";
import { C } from "../compile-error-utils";

/**
 * { // ApiEndpoints
 *   "/users": { // ApiEndpoint
 *     get: { // ApiSpec
 *       resBody: {
 *         200: { p: string }
 *       }
 *     }
 *   }
 * }
 */

export const Method = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
] as const;
export type Method = (typeof Method)[number];
export type CaseInsensitive<S extends string> = S | Uppercase<S> | Lowercase<S>;
export type CaseInsensitiveMethod = Method | Uppercase<Method>;
export const isMethod = (x: unknown): x is Method =>
  Method.includes(x as Method);

export type ApiEndpoint = Partial<Record<Method, ApiSpec>>;
export type AnyApiEndpoint = Partial<Record<Method, AnyApiSpec>>;
type AsJsonApiEndpoint<AE extends ApiEndpoint> = {
  // FIXME: NonNullableでいいんだっけ?
  [M in keyof AE & Method]: AsJsonApiSpec<NonNullable<AE[M]>>;
};
export type ApiEndpoints = { [Path in string]: ApiEndpoint };
export type AnyApiEndpoints = { [Path in string]: AnyApiEndpoint };

export type UnknownApiEndpoints = {
  [Path in string]: Partial<Record<Method, UnknownApiSpec>>;
};

export const apiSpecRequestKeys = Object.freeze([
  "query",
  "params",
  "body",
  "headers",
] as const);
export type ApiSpecRequestKey = (typeof apiSpecRequestKeys)[number];
export const apiSpecResponseKeys = Object.freeze(["body", "headers"] as const);
export const apiSpecKeys = Object.freeze([
  ...apiSpecRequestKeys,
  "responses",
] as const);
export interface BaseApiSpec<
  Params,
  Query,
  Body,
  RequestHeaders,
  Responses extends AnyApiResponses,
> {
  query?: Query;
  params?: Params;
  body?: Body;
  responses: Responses;
  headers?: RequestHeaders;
}
export type ApiSpec<
  ParamKeys extends string = string,
  Params extends Record<ParamKeys, string | number> = Record<
    ParamKeys,
    string | number
  >,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Query extends Record<string, string> = Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Body extends Record<string, any> | string = Record<string, any> | string,
  RequestHeaders extends Record<string, string> = Record<string, string>,
  Responses extends AnyApiResponses = AnyApiResponses,
> = BaseApiSpec<Params, Query, Body, RequestHeaders, Responses>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyApiSpec = BaseApiSpec<any, any, any, any, any>;
export type UnknownApiSpec = BaseApiSpec<
  unknown,
  unknown,
  unknown,
  unknown,
  DefineApiResponses<DefineResponse<unknown, unknown>>
>;

type JsonHeader = {
  "Content-Type": "application/json";
};

type WithJsonHeader<H extends Record<string, string> | undefined> =
  H extends Record<string, string> ? H & JsonHeader : JsonHeader;

type AsJsonApiSpec<AS extends ApiSpec> = Omit<AS, "headers" | "resHeaders"> & {
  headers: WithJsonHeader<AS["headers"]>;
  // FIXME: いい感じにマージが必要
  // response: {
  //   headers: WithJsonHeader<AS["response"]["headers"]>;
  // };
};

export type ApiP<
  E extends ApiEndpoints,
  Path extends (keyof E & string) | C.AnyE,
  M extends Method,
  P extends keyof ApiSpec,
> = Path extends keyof E & string
  ? E[Path] extends ApiEndpoint
    ? M extends Method
      ? E[Path][M] extends ApiSpec<ParseUrlParams<Path>>
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          E[Path][M][P] extends Record<string, any> | string
          ? E[Path][M][P]
          : undefined
        : undefined
      : undefined
    : undefined
  : undefined;

export type ApiHasP<
  E extends ApiEndpoints,
  Path extends keyof E & string,
  M extends Method,
> = E[Path] extends ApiEndpoint
  ? E[Path][M] extends ApiSpec<ParseUrlParams<Path>>
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      E[Path][M]["body"] extends Record<string, any>
      ? true
      : E[Path][M]["headers"] extends Record<string, string>
        ? true
        : false
    : never
  : never;

export type ApiRes<
  AResponses extends AnyApiResponses,
  SC extends keyof AResponses & StatusCode,
> = AResponses[SC] extends AnyResponse ? AResponses[SC]["body"] : undefined;
export type ApiResHeaders<
  AResponses extends AnyApiResponses,
  SC extends keyof AResponses & StatusCode,
> = AResponses[SC] extends AnyResponse
  ? AResponses[SC]["headers"]
  : Record<string, never>;
export type AnyApiResponses = DefineApiResponses<AnyResponse>;
export type DefineApiResponses<Response extends AnyResponse> = Partial<
  Record<StatusCode, Response>
>;
export type DefineResponse<Body, Headers> = { body: Body; headers?: Headers };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyResponse = DefineResponse<any, any>;
export type ApiClientResponses<AResponses extends AnyApiResponses> = {
  [SC in keyof AResponses & StatusCode]: ClientResponse<
    ApiRes<AResponses, SC>,
    SC,
    "json",
    ApiResHeaders<AResponses, SC>
  >;
};
export type MergeApiResponseBodies<AR extends AnyApiResponses> =
  ApiClientResponses<AR>[keyof ApiClientResponses<AR>];

/**
 * DefineApiEndpoints is a type that is used to define the type of the API endpoint.
 */
export type DefineApiEndpoints<E extends ApiEndpoints> = E;

export type AsJsonApi<E extends ApiEndpoints> = {
  [Path in keyof E & string]: AsJsonApiEndpoint<E[Path]>;
};
