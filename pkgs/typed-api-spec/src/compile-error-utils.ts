// Type Utilities for Compile error message
// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace C {
  const e: unique symbol;
  const ok: unique symbol;
  export type E<MSG> = { [e]: MSG };
  export type OK = { [ok]: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type AnyE = E<any>;
}
