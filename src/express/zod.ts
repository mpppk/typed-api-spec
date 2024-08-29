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
    ? ValidateLocals<ZodValidators<ZodE[Path][M], string>>
    : Record<string, never>
>;

// export type ToHandler<
//   Spec extends ApiSpec | undefined,
//   Validators extends AnyValidators,
// > = Handler<Spec, ValidateLocals<Validators>>;

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

// export type ToHandlers<
//   ZodE extends ZodApiEndpoints,
//   E extends ToApiEndpoints<ZodE> = ToApiEndpoints<ZodE>,
// > = {
//   [Path in keyof E & string]: {
//     [M in Method]: ToHandler<
//       ZodE[Path][M] extends ZodApiSpec ? ToApiSpec<ZodE[Path][M]> : undefined,
//       ZodE[Path][M] extends ZodApiSpec
//         ? ZodValidators<ZodE[Path][M], string>
//         : Record<string, never>
//     >;
//   };
// };
