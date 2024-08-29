import { IRouter, RequestHandler, Router } from "express";
import {
  ZodApiEndpoints,
  Method,
  ApiResponses,
  ApiRes,
  ApiSpec,
  newZodValidator,
} from "../index";
import {
  NextFunction,
  ParamsDictionary,
  Request,
  Response,
} from "express-serve-static-core";
import { StatusCode } from "../common";
import { ParsedQs } from "qs";
import { AnyValidators, ValidatorsInput } from "../common/validate";
import { ToHandler } from "./zod";

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
  res: ExpressResponse<NonNullable<Spec>["resBody"], 200, Locals>,
  next: NextFunction,
) => void;

/**
 * Express Response, but with more strict type information.
 */
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

export type ValidateLocals<Vs extends AnyValidators | Record<string, never>> = {
  validate: (req: Request<ParamsDictionary, unknown, unknown, unknown>) => Vs;
};

/**
 * Express Router, but with more strict type information.
 */
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

export const validatorMiddleware = <
  V extends (input: ValidatorsInput) => AnyValidators,
>(
  validator: V,
) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.locals.validate = (req: Request) => {
      return validator({
        path: req.route?.path?.toString(),
        method: req.method,
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body,
      });
    };
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
  router.use(validatorMiddleware(newZodValidator(pathMap)));
  return router;
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
export const asAsync = <Router extends IRouter | RouterT<never>>(
  router: Router,
): Router => {
  return new Proxy(router, {
    get(target, prop, receiver) {
      const o = Reflect.get(target, prop, receiver);
      if (typeof prop !== "string") {
        return o;
      }
      if (![...Method, "all"].includes(prop)) {
        return o;
      }
      if (typeof o !== "function") {
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
          .map((h) => (typeof h === "function" ? wrap(h) : h));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return o.apply(target, [args[0], ...handlers] as any);
      };
    },
  });
};
