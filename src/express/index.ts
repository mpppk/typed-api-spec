import { IRouter, RequestHandler, Router } from "express";
import {
  ZodApiEndpoints,
  ZodApiSpec,
  Method,
  ApiSpec,
  ApiResponses,
  ApiResSchema,
} from "../index";
import { ZodValidator, ZodValidators } from "../zod";
import {
  NextFunction,
  ParamsDictionary,
  Request,
  Response,
} from "express-serve-static-core";
import { StatusCode } from "../common";
import { ParseUrlParams } from "../common";

export interface ParsedQs {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[];
}
export type Handler<
  Spec extends ZodApiSpec | undefined,
  SC extends keyof NonNullable<ApiSpec>["res"] & StatusCode = 200,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Locals extends Record<string, any> = Record<string, never>,
> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Request<ParamsDictionary, any, any, ParsedQs, Locals>,
  res: ExpressResponse<NonNullable<Spec>["res"], SC, Locals>,
  next: NextFunction,
) => void;

export type ExpressResponse<
  Responses extends ApiResponses,
  SC extends keyof Responses & StatusCode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LocalsObj extends Record<string, any> = Record<string, any>,
> = Omit<Response<ApiResSchema<Responses, SC>, LocalsObj, SC>, "status"> & {
  status: <SC extends keyof Responses & StatusCode>(
    s: SC,
  ) => Response<ApiResSchema<Responses, SC>, LocalsObj, SC>;
};

export type ValidateLocals<
  AS extends ZodApiSpec | undefined,
  QueryKeys extends string,
> = AS extends ZodApiSpec
  ? {
      validate: (
        req: Request<ParamsDictionary, unknown, unknown, unknown>,
      ) => ZodValidators<AS, QueryKeys>;
    }
  : Record<string, never>;

export type RouterT<
  Endpoints extends ZodApiEndpoints,
  SC extends StatusCode = StatusCode,
> = Omit<IRouter, Method> & {
  [M in Method]: <Path extends string & keyof Endpoints>(
    path: Path,
    ...handlers: Array<
      Handler<
        Endpoints[Path][M],
        SC,
        ValidateLocals<Endpoints[Path][M], ParseUrlParams<Path>>
      >
    >
  ) => RouterT<Endpoints, SC>;
};

const validatorMiddleware = (pathMap: ZodApiEndpoints) => {
  const validator = newValidator(pathMap);
  return (_req: Request, res: Response, next: NextFunction) => {
    res.locals.validate = validator;
    next();
  };
};

export const typed = <const Endpoints extends ZodApiEndpoints>(
  pathMap: Endpoints,
  router: Router,
): RouterT<Endpoints> => {
  router.use(validatorMiddleware(pathMap));
  return router;
};

export const newValidator = <E extends ZodApiEndpoints>(endpoints: E) => {
  return <Path extends keyof E, M extends keyof E[Path] & Method>(
    req: Request,
  ) => {
    const spec: E[Path][M] =
      endpoints[req.route.path][req.method.toLowerCase() as Method];
    return {
      params: () =>
        spec?.params?.safeParse(req.params) as E[Path][M] extends ZodApiSpec
          ? ZodValidator<E[Path][M]["params"]>
          : undefined,
      body: () =>
        spec?.body?.safeParse(req.body) as E[Path][M] extends ZodApiSpec
          ? ZodValidator<E[Path][M]["body"]>
          : undefined,
      query: () =>
        spec?.query?.safeParse(req.query) as E[Path][M] extends ZodApiSpec
          ? ZodValidator<E[Path][M]["query"]>
          : undefined,
    };
  };
};

export type AsyncRequestHandler<Handler extends RequestHandler> = (
  req: Parameters<NoInfer<Handler>>[0],
  res: Parameters<NoInfer<Handler>>[1],
  next: Parameters<NoInfer<Handler>>[2],
) => Promise<unknown>;

export const wrap = <Handler extends RequestHandler>(
  handler: AsyncRequestHandler<Handler>,
): Handler => {
  return ((req, res, next) => {
    handler(req, res, next).catch(next);
  }) as Handler;
};

const wrapHandlers = (handlers: never[]) =>
  handlers.map((h) => wrap(h) as never);
export const asAsync = <T extends ZodApiEndpoints>(
  router: RouterT<T>,
): RouterT<T> => {
  return Method.reduce((acc, method) => {
    return {
      ...acc,
      [method]: (path: string, ...handlers: never[]) =>
        router[method](path, ...wrapHandlers(handlers)),
    };
  }, {} as RouterT<T>);
};
