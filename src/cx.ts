import type { ClassNames } from "./types";
import { appendString, forEach } from "./utils";

export const caches = {
  reset: new Set<string>(),
  atomic: new Map<string, string | undefined>(),
  hover: new Map<string, string | undefined>(),
  focus: new Map<string, string | undefined>(),
  active: new Map<string, string | undefined>(),
};

const extractClassNames = (items: ClassNames, acc: string[]): string[] => {
  for (const item of items) {
    if (typeof item === "string") {
      for (const part of item.split(" ")) {
        if (part !== "") {
          acc.push(part);
        }
      }
    } else if (Array.isArray(item)) {
      extractClassNames(item, acc);
    }
  }

  return acc;
};

const appendClassNames = (
  acc: string,
  classNames: Record<string, string>,
): string => {
  let output = acc;

  forEach(classNames, (_, value) => {
    output = appendString(output, value);
  });

  return output;
};

export const cx = (...items: ClassNames): string => {
  const classNames = extractClassNames(items, []);

  let output = "";

  let cacheKey: string | undefined = undefined;
  let reset: string | undefined = undefined;

  const atomic: Record<string, string> = {};
  const hover: Record<string, string> = {};
  const focus: Record<string, string> = {};
  const active: Record<string, string> = {};

  for (const className of classNames) {
    cacheKey = caches.atomic.get(className);

    if (cacheKey != null) {
      atomic[cacheKey] = className;
      continue;
    }

    cacheKey = caches.hover.get(className);

    if (cacheKey != null) {
      hover[cacheKey] = className;
      continue;
    }

    cacheKey = caches.focus.get(className);

    if (cacheKey != null) {
      focus[cacheKey] = className;
      continue;
    }

    cacheKey = caches.active.get(className);

    if (cacheKey != null) {
      active[cacheKey] = className;
      continue;
    }

    if (caches.reset.has(className)) {
      if (reset == null) {
        reset = className;
      } else if (reset !== className) {
        if (process.env.NODE_ENV === "development") {
          console.warn("`cx` only accepts one reset style.");
        }
      }
    } else {
      output = appendString(output, className);
    }
  }

  if (reset != null) {
    output = appendString(output, reset);
  }

  output = appendClassNames(output, atomic);
  output = appendClassNames(output, hover);
  output = appendClassNames(output, focus);
  output = appendClassNames(output, active);

  return output;
};
