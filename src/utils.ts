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
