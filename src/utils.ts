import { ValueOf } from "./types";

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

export const memoizeOne = <T>(fn: (value: string) => T) => {
  const cache: Record<string, T> = Object.create(null);

  return (value: string): T => {
    if (cache[value] === undefined) {
      cache[value] = fn(value);
    }

    return cache[value];
  };
};

export const memoizeTwo = <T>(
  fn: (key: string, value: string | number) => T,
) => {
  const cache: Record<string, T> = Object.create(null);

  return (key: string, value: string | number): T => {
    const cacheKey = key + ":" + value;

    if (cache[cacheKey] === undefined) {
      cache[cacheKey] = fn(key, value);
    }

    return cache[cacheKey];
  };
};
