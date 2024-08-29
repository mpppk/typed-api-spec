import {
  ToApiEndpoints,
  ZodApiEndpoints,
  ZodApiSpec,
  ZodValidators,
} from "../zod";
import { Method } from "../common";
import { Handler, ValidateLocals } from "./index";

/**
 * Convert ZodApiSpec to Express Request Handler type.
 */
export type ToHandler<
  ZodE extends ZodApiEndpoints,
  Path extends keyof ZodE & string,
  M extends Method,
> = Handler<
  ToApiEndpoints<ZodE>[Path][M],
  ZodE[Path][M] extends ZodApiSpec
    ? ZodValidateLocals<
        ZodE[Path][M],
        // FIXME
        // ParseUrlParams<Path> extends never ? string : ParseUrlParams<Path>
        string
      >
    : Record<string, never>
>;

/**
 * Convert ZodApiEndpoints to Express Request Handler type map.
 */
export type ToHandlers<
  ZodE extends ZodApiEndpoints,
  E extends ToApiEndpoints<ZodE> = ToApiEndpoints<ZodE>,
> = {
  [Path in keyof E & string]: {
    [M in Method]: ToHandler<ZodE, Path, M>;
  };
};

export type ZodValidateLocals<
  AS extends ZodApiSpec,
  ParamKeys extends string,
> = ValidateLocals<ZodValidators<AS, ParamKeys>>;
