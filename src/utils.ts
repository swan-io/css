import type { ValueOf } from "./types";

export const appendString = (acc: string, value: string): string =>
  acc + (acc ? " " + value : value);

export const forEach = <T extends Record<PropertyKey, unknown>>(
  object: T,
  callback: (key: keyof T, value: NonNullable<ValueOf<T>>) => void,
) => {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const value = object[key];

      if (value != null) {
        callback(key, value);
      }
    }
  }
};

export const memoize = <T>(fn: (arg: string) => T) => {
  const cache: Record<string, T> = Object.create(null);

  return (arg: string): T => {
    if (cache[arg] == null) {
      cache[arg] = fn(arg);
    }

    return cache[arg];
  };
};
