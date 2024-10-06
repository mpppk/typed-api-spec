// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace TResult {
  const e: unique symbol;
  const ok: unique symbol;
  export type E<MSG> = { [e]: MSG };
  export type OK = { [ok]: true };
}
