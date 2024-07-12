import { IRouter, RequestHandler, Router } from "express";
import {
  ZodApiEndpoints,
  ZodApiSpec,
  Method,
  ApiResponses,
  ApiRes,
  ToApiEndpoints,
  ApiSpec,
} from "../index";
import { ZodValidators } from "../zod";
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
  Spec extends ApiSpec | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Locals extends Record<string, any> = Record<string, never>,
> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Request<ParamsDictionary, any, any, ParsedQs, Locals>,
  res: ExpressResponse<NonNullable<Spec>["resBody"], 200, Locals>,
  next: NextFunction,
) => void;

export type ToHandler<
  ZodE extends ZodApiEndpoints,
  Path extends keyof ZodE & string,
  M extends Method,
> = Handler<
  ToApiEndpoints<ZodE>[Path][M],
  ValidateLocals<ZodE[Path][M], ParseUrlParams<Path>>
>;

export type ToHandlers<
  ZodE extends ZodApiEndpoints,
  E extends ToApiEndpoints<ZodE> = ToApiEndpoints<ZodE>,
> = {
  [Path in keyof E & string]: {
    [M in Method]: ToHandler<ZodE, Path, M>;
  };
};

export type ExpressResponse<
  Responses extends ApiResponses,
  SC extends keyof Responses & StatusCode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LocalsObj extends Record<string, any> = Record<string, any>,
> = Omit<Response<ApiRes<Responses, SC>, LocalsObj, SC>, "status"> & {
  status: <SC extends keyof Responses & StatusCode>(
    s: SC,
  ) => Response<ApiRes<Responses, SC>, LocalsObj, SC>;
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
  ZodE extends ZodApiEndpoints,
  SC extends StatusCode = StatusCode,
> = Omit<IRouter, Method> & {
  [M in Method]: <Path extends string & keyof ZodE>(
    path: Path,
    ...handlers: [
      // Middlewareは複数のエンドポイントで実装を使い回されることがあるので、型チェックはゆるくする
      ...Array<RequestHandler>,
      // Handlerは厳密に型チェックする
      ToHandler<ZodE, Path, M>,
    ]
  ) => RouterT<ZodE, SC>;
};

const validatorMiddleware = (pathMap: ZodApiEndpoints) => {
  const validator = newValidator(pathMap);
  return (_req: Request, res: Response, next: NextFunction) => {
    res.locals.validate = validator;
    next();
  };
};

/**
 * Set validator and add more strict type information to router.
 *
 * @param pathMap API endpoints
 * @param router Express Router
 *
 * @example
 * ```
 * const router = typed(pathMap, express.Router())
 * router.get('/path', (req, res) => {
 *   const r = res.locals.validate(req).query()
 *   if (!r.success) {
 *     return res.status(400).json({ message: 'Invalid query' })
 *   }
 *   return res.status(200).json({ message: 'success', value: r.data.value })
 * })
 * ```
 */
export const typed = <const Endpoints extends ZodApiEndpoints>(
  pathMap: Endpoints,
  router: Router,
): RouterT<Endpoints> => {
  router.use(validatorMiddleware(pathMap));
  return router;
};

/**
 * Create a new validator for the given endpoints.
 *
 * @param endpoints API endpoints
 */
export const newValidator = <E extends ZodApiEndpoints>(endpoints: E) => {
  return <Path extends keyof E, M extends keyof E[Path] & Method>(
    req: Request,
  ) => {
    const spec: E[Path][M] =
      endpoints[req.route.path][req.method.toLowerCase() as Method];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zodValidators: Record<string, any> = {};

    if (spec?.params !== undefined) {
      const params = spec.params;
      zodValidators["params"] = () => params.safeParse(req.params);
    }
    if (spec?.query !== undefined) {
      const query = spec.query;
      zodValidators["query"] = () => query.safeParse(req.query);
    }
    if (spec?.body !== undefined) {
      const body = spec.body;
      zodValidators["body"] = () => body.safeParse(req.body);
    }
    if (spec?.headers !== undefined) {
      const headers = spec.headers;
      zodValidators["headers"] = () => headers.safeParse(req.headers);
    }
    return zodValidators as E[Path][M] extends ZodApiSpec
      ? ZodValidators<E[Path][M], "">
      : Record<string, unknown>;
  };
};

export type AsyncRequestHandler<Handler extends RequestHandler> = (
  req: Parameters<NoInfer<Handler>>[0],
  res: Parameters<NoInfer<Handler>>[1],
  next: Parameters<NoInfer<Handler>>[2],
) => Promise<unknown>;

/**
 * Wrap async handler to catch error and pass it to next function.
 *
 * @example
 * ```
 * const router = express.Router();
 * const handler = async (req, res) => {
 *   res.status(200).json({ message: 'success' });
 * }
 * router.get('/path', wrap(handler));
 * ```
 *
 * @param handler
 */
export const wrap = <Handler extends RequestHandler>(
  handler: AsyncRequestHandler<Handler>,
): Handler => {
  return ((req, res, next) => {
    handler(req, res, next).catch(next);
  }) as Handler;
};

const wrapHandlers = (handlers: never[]) =>
  handlers.map((h) => wrap(h) as never);

/**
 * Return Express Router wrapper which accept async handlers.
 * If async handler throws an error, it will be caught and passed to next function.
 *
 * @example
 * ```
 * const router = asAsync(express.Router());
 * router.get('/path', async (req, res) => {
 *   await sleep(1000);
 *   res.status(200).json({ message: 'success' });
 *   return;
 * });
 * ```
 * @param router Express.Router to be wrapped
 */
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
