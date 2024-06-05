import { ParseUrlParams } from "./url";
import { ClientResponse, StatusCode } from "./hono-types";

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

export type ApiEndpoint<Path> = Partial<
  Record<Method, ApiSpec<ParseUrlParams<Path>>>
>;
export type ApiEndpoints = {
  [K in string]: ApiEndpoint<K>;
};

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
> {
  query?: Query;
  params?: Params;
  body?: Body;
  res: Response;
}

export type ApiBodySchema<
  E extends ApiEndpoints,
  Path extends keyof E & string,
  M extends Method,
> = E[Path] extends undefined
  ? undefined
  : E[Path][M] extends undefined
    ? undefined
    : NonNullable<E[Path][M]>["body"] extends undefined
      ? undefined
      : NonNullable<NonNullable<E[Path][M]>["body"]>;

export type ApiResSchema<
  AResponses extends ApiResponses,
  SC extends keyof AResponses & StatusCode,
  Res = object,
> = AResponses[SC] extends Res ? AResponses[SC] : never;
export type ApiResponses<Res = object> = Partial<Record<StatusCode, Res>>;
export type ApiClientResponses<AResponses extends ApiResponses> = {
  [SC in keyof AResponses & StatusCode]: ClientResponse<
    ApiResSchema<AResponses, SC>,
    SC,
    "json"
  >;
};
export type MergeApiResponses<AR extends ApiResponses> =
  ApiClientResponses<AR>[keyof ApiClientResponses<AR>];
