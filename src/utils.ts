// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const unreachable = (_x: never): never => {
  throw new Error("Unreachable code!");
};

/**
 * 成功/失敗のどちらかの状態を持つオブジェクト
 * 成功時のはdata, 失敗時はerrorとして値を持つ
 */
export type Result<T, U> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: U };

/**
 * Result型を生成するためのユーティリティメソッド群
 */
export const Result = {
  data: <T>(data: T) => ({ data }),
  error: <U>(error: U) => ({ error }),
  map: <T, U, V>(r: Result<T, U>, mapper: (t: T) => V): Result<V, U> => {
    return r.data ? Result.data(mapper(r.data)) : (r as Result<V, U>);
  },
  mapE: <T, U, V>(r: Result<T, U>, mapper: (u: U) => V): Result<T, V> => {
    return r.error ? Result.error(mapper(r.error)) : (r as Result<T, V>);
  },
  andThen: <T, U, V>(
    r: Result<T, U>,
    mapper: (t: T) => Result<V, U>,
  ): Result<V, U> => {
    return r.data ? mapper(r.data) : (r as Result<V, U>);
  },
  unwrap: <T, U>(r: Result<T, U>): T => {
    if (r.data) {
      return r.data;
    }
    throw r.error;
  },
  unwrap_or: <T, U>(r: Result<T, U>, defaultValue: T): T => {
    return r.data ?? defaultValue;
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEmptyObject = (obj: Record<any, unknown>): boolean =>
  Object.keys(obj).length === 0;
