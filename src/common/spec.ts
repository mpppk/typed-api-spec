import { ParseUrlParams } from "./url";
import { ClientResponse, StatusCode } from "./hono-types";

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

export interface BaseApiSpec<
  Params,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Query,
  Body,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResBody,
  RequestHeaders,
  ResponseHeaders,
> {
  query?: Query;
  params?: Params;
  body?: Body;
  resBody: ResBody;
  headers?: RequestHeaders;
  resHeaders?: ResponseHeaders;
}
export type ApiSpec<
  ParamKeys extends string = string,
  Params extends Record<ParamKeys, string | number> = Record<
    ParamKeys,
    string | number
  >,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Query extends Record<string, string> = Record<string, any>,
  Body extends object = object,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResBody extends Partial<Record<StatusCode, any>> = Partial<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<StatusCode, any>
  >,
  RequestHeaders extends Record<string, string> = Record<string, string>,
  ResponseHeaders extends Record<string, string> = Record<string, string>,
> = BaseApiSpec<Params, Query, Body, ResBody, RequestHeaders, ResponseHeaders>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyApiSpec = BaseApiSpec<any, any, any, any, any, any>;

type JsonHeader = {
  "Content-Type": "application/json";
};

type WithJsonHeader<H extends Record<string, string> | undefined> =
  H extends Record<string, string> ? H & JsonHeader : JsonHeader;

type AsJsonApiSpec<AS extends ApiSpec> = Omit<AS, "headers" | "resHeaders"> & {
  headers: WithJsonHeader<AS["headers"]>;
  resHeaders: WithJsonHeader<AS["resHeaders"]>;
};

export type ApiP<
  E extends ApiEndpoints,
  Path extends keyof E & string,
  M extends Method,
  P extends keyof ApiSpec,
> = E[Path] extends ApiEndpoint
  ? E[Path][M] extends ApiSpec<ParseUrlParams<Path>>
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      E[Path][M][P] extends Record<string, any>
      ? E[Path][M][P]
      : never
    : never
  : never;

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
  AResponses extends ApiResponses,
  SC extends keyof AResponses & StatusCode,
  Res = object,
> = AResponses[SC] extends Res ? AResponses[SC] : never;
export type ApiResponses<Res = object> = Partial<Record<StatusCode, Res>>;
export type ApiClientResponses<AResponses extends ApiResponses> = {
  [SC in keyof AResponses & StatusCode]: ClientResponse<
    ApiRes<AResponses, SC>,
    SC,
    "json"
  >;
};
export type MergeApiResponses<AR extends ApiResponses> =
  ApiClientResponses<AR>[keyof ApiClientResponses<AR>];

/**
 * DefineApiEndpoints is a type that is used to define the type of the API endpoint.
 */
export type DefineApiEndpoints<E extends ApiEndpoints> = E;

export type AsJsonApi<E extends ApiEndpoints> = {
  [Path in keyof E & string]: AsJsonApiEndpoint<E[Path]>;
};
