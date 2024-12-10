import { IRouter, RequestHandler } from "express";
import {
  Method,
  AnyApiResponses,
  ApiResBody,
  ApiSpec,
  AnyApiSpec,
  AnyApiEndpoints,
} from "../index";
import {
  NextFunction,
  ParamsDictionary,
  Request,
  Response,
} from "express-serve-static-core";
import { StatusCode } from "../core";
import { ParsedQs } from "qs";
import {
  AnyValidators,
  RequestValidator,
  ValidatorsMap,
} from "../core/validator/request";
import { Result } from "../utils";

/**
 * Express Request Handler, but with more strict type information.
 * @param req Express Request
 * @param res Express Response
 * @param next Express Next function
 */
export type Handler<
  Spec extends ApiSpec | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Locals extends Record<string, any> = Record<string, never>,
> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Request<ParamsDictionary, any, any, ParsedQs, Locals>,
  res: ExpressResponse<NonNullable<Spec>["responses"], 200, Locals>,
  next: NextFunction,
) => void;

export type ToHandler<
  Spec extends AnyApiSpec | undefined,
  Validators extends AnyValidators | undefined,
> = Handler<
  Spec,
  ValidateLocals<
    Validators extends AnyValidators ? Validators : Record<string, never>
  >
>;

export type ToHandlers<E extends AnyApiEndpoints, V extends ValidatorsMap> = {
  [Path in keyof E & string]: {
    [M in Method]: ToHandler<E[Path][M], V[Path][M]>;
  };
};

/**
 * Express Response, but with more strict type information.
 */
export type ExpressResponse<
  Responses extends AnyApiResponses,
  SC extends keyof Responses & StatusCode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LocalsObj extends Record<string, any> = Record<string, any>,
> = Omit<Response<ApiResBody<Responses, SC>, LocalsObj, SC>, "status"> & {
  status: <SC extends keyof Responses & StatusCode>(
    s: SC,
  ) => Response<ApiResBody<Responses, SC>, LocalsObj, SC>;
};

export type ValidateLocals<Vs extends AnyValidators | Record<string, never>> = {
  validate: (req: Request<ParamsDictionary, unknown, unknown, unknown>) => Vs;
};

/**
 * Express Router, but with more strict type information.
 */
export type RouterT<
  E extends AnyApiEndpoints,
  V extends ValidatorsMap,
  SC extends StatusCode = StatusCode,
> = Omit<IRouter, Method> & {
  [M in Method]: <Path extends string & keyof E>(
    path: Path,
    ...handlers: [
      // Middlewareは複数のエンドポイントで実装を使い回されることがあるので、型チェックはゆるくする
      ...Array<RequestHandler>,
      // Handlerは厳密に型チェックする
      ToHandler<E[Path][M], V[Path][M]>,
    ]
  ) => RouterT<E, V, SC>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validatorMiddleware = <V extends RequestValidator>(
  validator: V,
) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.locals.validate = (req: Request) => {
      const { data: v2, error } = validator({
        path: req.route?.path?.toString(),
        method: req.method.toLowerCase(),
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body,
      });
      if (error) {
        return {
          query: () => Result.error(error),
          params: () => Result.error(error),
          body: () => Result.error(error),
          headers: () => Result.error(error),
        };
      }
      return v2;
    };
    next();
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const asAsync = <Router extends IRouter | RouterT<any, any>>(
  router: Router,
): Router => {
  return new Proxy(router, {
    get(target, prop, receiver) {
      // o is the original method of the provided router
      const o = Reflect.get(target, prop, receiver);
      if (
        // prop may be string or symbol. We only want to wrap string methods.
        typeof prop !== "string" ||
        // We only wrap methods that are represents HTTP methods.
        ![...Method, "all"].includes(prop) ||
        // If `prop` is one of the HTTP methods, `o` should be a function, but we check just to be sure.
        typeof o !== "function"
      ) {
        // If it's not a method we want to wrap, just return the original method.
        return o;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (...args: any[]) => {
        if (args.length <= 1) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return o.apply(target, args as any);
        }
        const handlers = args
          .slice(1)
          // wrap all middleware and handlers
          .map((h) => (typeof h === "function" ? wrap(h) : h));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return o.apply(target, [args[0], ...handlers] as any);
      };
    },
  });
};
