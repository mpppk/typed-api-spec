import { ParseUrlParams } from "./url";
import { ClientResponse, StatusCode } from "./hono-types";

/**
 * { // ApiEndpoints
 *   "/users": { // ApiEndpoint
 *     get: { // ApiSpec
 *       res: {
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

export type ApiEndpoint = Partial<Record<Method, ApiSpec>>;
type AsJsonApiEndpoint<AE extends ApiEndpoint> = {
  // FIXME: NonNullableでいいんだっけ?
  [M in keyof AE & Method]: AsJsonApiSpec<NonNullable<AE[M]>>;
};
export type ApiEndpoints = { [Path in string]: ApiEndpoint };

export interface ApiSpec<
  ParamKeys extends string = string,
  Params extends Record<ParamKeys, string | number> = Record<
    ParamKeys,
    string | number
  >,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Query extends Record<string, string> = Record<string, any>,
  Body extends object = object,
  Response extends Partial<Record<StatusCode, object>> = Partial<
    Record<StatusCode, object>
  >,
  RequestHeaders extends Record<string, string> = Record<string, string>,
  ResponseHeaders extends Record<string, string> = Record<string, string>,
> {
  query?: Query;
  params?: Params;
  body?: Body;
  res: Response;
  reqHeaders?: RequestHeaders;
  resHeaders?: ResponseHeaders;
}

type JsonHeader = {
  "Content-Type": "application/json";
};

type WithJsonHeader<H extends Record<string, string> | undefined> =
  H extends Record<string, string> ? H & JsonHeader : JsonHeader;

type AsJsonApiSpec<AS extends ApiSpec> = Omit<
  AS,
  "reqHeaders" | "resHeaders"
> & {
  reqHeaders: WithJsonHeader<AS["reqHeaders"]>;
  resHeaders: WithJsonHeader<AS["resHeaders"]>;
};

export type ApiP<
  E extends ApiEndpoints,
  Path extends keyof E & string,
  M extends Method,
  P extends keyof ApiSpec,
> = E[Path] extends ApiEndpoint
  ? E[Path][M] extends ApiSpec<ParseUrlParams<Path>>
    ? E[Path][M][P] extends Record<string, string>
      ? E[Path][M][P]
      : never
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
