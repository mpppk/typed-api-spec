import {
  newZodValidator,
  ToApiEndpoints,
  ZodApiEndpoints,
  ZodApiSpec,
  ZodValidators,
} from "../zod";
import { Method } from "../common";
import {
  RouterT,
  ToHandler as ToPureHandler,
  ToHandlers as ToPureHandlers,
  validatorMiddleware,
} from "./index";
import { Router } from "express";

/**
 * Convert ZodApiSpec to Express Request Handler type.
 */
export type ToHandler<
  ZodE extends ZodApiEndpoints,
  Path extends keyof ZodE & string,
  M extends Method,
> = ToPureHandler<ToApiEndpoints<ZodE>[Path][M], ToValidators<ZodE[Path][M]>>;

export type ToValidators<Spec extends ZodApiSpec | undefined> =
  Spec extends ZodApiSpec ? ZodValidators<Spec, string> : Record<string, never>;

/**
 * Convert ZodApiEndpoints to Express Request Handler type map.
 */
export type ToHandlers<
  ZodE extends ZodApiEndpoints,
  E extends ToApiEndpoints<ZodE> = ToApiEndpoints<ZodE>,
  V extends ToValidatorsMap<ZodE> = ToValidatorsMap<ZodE>,
> = ToPureHandlers<E, V>;

export type ToValidatorsMap<ZodE extends ZodApiEndpoints> = {
  [Path in keyof ZodE & string]: {
    [M in Method]: ToValidators<ZodE[Path][M]>;
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
 *   const {data, error} = res.locals.validate(req).query()
 *   if (error) {
 *     return res.status(400).json({ message: 'Invalid query' })
 *   }
 *   return res.status(200).json({ message: 'success', value: r.data.value })
 * })
 * ```
 */
export const typed = <const Endpoints extends ZodApiEndpoints>(
  pathMap: Endpoints,
  router: Router,
): RouterT<ToApiEndpoints<Endpoints>, ToValidatorsMap<Endpoints>> => {
  router.use(validatorMiddleware(newZodValidator(pathMap)));
  return router;
};
