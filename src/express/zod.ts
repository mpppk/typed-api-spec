import {
  ToApiEndpoints,
  ZodApiEndpoints,
  ZodApiSpec,
  ZodValidators,
} from "../zod";
import { Method } from "../common";
import { ToHandler } from "./index";

/**
 * Convert ZodApiSpec to Express Request Handler type.
 */
export type ZodToHandler<
  ZodE extends ZodApiEndpoints,
  Path extends keyof ZodE & string,
  M extends Method,
> = ToHandler<ToApiEndpoints<ZodE>[Path][M], ToZodValidators<ZodE[Path][M]>>;

export type ToZodValidators<Spec extends ZodApiSpec | undefined> =
  Spec extends ZodApiSpec ? ZodValidators<Spec, string> : Record<string, never>;

/**
 * Convert ZodApiEndpoints to Express Request Handler type map.
 */
export type ZodToHandlers<
  ZodE extends ZodApiEndpoints,
  E extends ToApiEndpoints<ZodE> = ToApiEndpoints<ZodE>,
> = {
  [Path in keyof E & string]: {
    [M in Method]: ZodToHandler<ZodE, Path, M>;
  };
};
