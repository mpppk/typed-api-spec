import { ZodApiEndpoint, ZodApiEndpoints, ZodApiSpec } from "../zod";
import { Method } from "../common";

type FastifySchema<Spec extends ZodApiSpec> = {
  querystring: Spec["query"];
  params: Spec["params"];
  body: Spec["body"];
  headers: Spec["headers"];
  response: Spec["resBody"];
};
export const toSchema = <Spec extends ZodApiSpec>(
  spec: Spec,
): FastifySchema<Spec> => {
  return {
    querystring: spec.query,
    params: spec.params,
    body: spec.body,
    headers: spec.headers,
    response: spec.resBody,
  };
};

type FastifyRoute<
  Spec extends ZodApiSpec,
  Url extends string,
  M extends Method,
> = {
  method: M;
  url: Url;
  schema: FastifySchema<Spec>;
};
const specToRoute = <
  Spec extends ZodApiSpec,
  Path extends string,
  M extends Method,
>(
  url: Path,
  method: M,
  spec: Spec,
): FastifyRoute<Spec, Path, M> => {
  return {
    method,
    url,
    schema: toSchema(spec),
  };
};
type EndpointFastifyRoute<
  Endpoint extends ZodApiEndpoint,
  Path extends string,
> = {
  [M in keyof Endpoint & Method]: FastifyRoute<
    NonNullable<Endpoint[M]>,
    Path,
    M
  >;
};
const endpointToRoute = <Endpoint extends ZodApiEndpoint, Path extends string>(
  path: Path,
  endpoint: Endpoint,
): EndpointFastifyRoute<Endpoint, Path> => {
  return Object.entries(endpoint).reduce(
    (acc, [method, spec]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc as any)[method] = specToRoute(path, method as Method, spec);
      return acc;
    },
    {} as EndpointFastifyRoute<Endpoint, Path>,
  );
};
type EndpointsFastifyRoute<Endpoints extends ZodApiEndpoints> = {
  [Path in keyof Endpoints & string]: EndpointFastifyRoute<
    Endpoints[Path],
    Path
  >;
};
export const toRoutes = <ZodE extends ZodApiEndpoints>(
  e: ZodE,
): EndpointsFastifyRoute<ZodE> => {
  return Object.entries(e).reduce((acc, [path, endpoint]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (acc as any)[path] = endpointToRoute(path, endpoint);
    return acc;
  }, {} as EndpointsFastifyRoute<ZodE>);
};
