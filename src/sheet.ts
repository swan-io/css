import { hash } from "./hash";
import { hyphenateName } from "./hyphenateName";
import { normalizeValue } from "./normalizeValue";
import type { ClassNames, FlatStyle, Keyframes, Style } from "./types";
import { forEach } from "./utils";

const getSheet = (id: string): CSSStyleSheet | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const current = document.querySelector<HTMLStyleElement>(`style[id="${id}"]`);

  if (current != null) {
    return current.sheet;
  }

  const element = document.createElement("style");
  element.setAttribute("id", id);
  document.head.appendChild(element);

  return element.sheet;
};

const getMediaRule = (
  sheet: CSSStyleSheet | null,
  index: number,
  media: string,
): {
  cssRules: CSSRuleList | [];
  insertRule: (rule: string) => void;
} => {
  if (sheet == null) {
    return {
      cssRules: [],
      insertRule: () => {},
    };
  }

  if (sheet.cssRules[index] == null) {
    try {
      sheet.insertRule(`@media ${media}{}`, index);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }

      return {
        cssRules: [],
        insertRule: () => {},
      };
    }
  }

  const mediaRule = sheet.cssRules[index] as CSSMediaRule;

  return {
    cssRules: mediaRule.cssRules,
    insertRule: (rule) => {
      try {
        mediaRule.insertRule(rule, mediaRule.cssRules.length);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
      }
    },
  };
};

const stringifyRule = (key: string, value: string | number): string => {
  if (key === "appearance") {
    return `-webkit-appearance:${value};appearance:${value}`;
  }
  if (key === "lineClamp") {
    return `-webkit-line-clamp:${value};line-clamp:${value}`;
  }

  return `${hyphenateName(key)}:${normalizeValue(key, value)}`;
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

const appendString = (acc: string, value: string): string =>
  acc + (acc ? " " + value : value);

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

const getClassName = (rule: CSSStyleRule): string => {
  const selector = rule.selectorText;
  const end = selector.indexOf(":");
  return end > -1 ? selector.substring(1, end) : selector.substring(1);
};

export const createSheet = () => {
  const sheet = getSheet("swan-stylesheet");

  const keyframesSheet = getMediaRule(sheet, 0, "all");
  const resetSheet = getMediaRule(sheet, 1, "all");
  const atomicSheet = getMediaRule(sheet, 2, "all");
  const hoverSheet = getMediaRule(sheet, 3, "(hover:hover)");
  const focusSheet = getMediaRule(sheet, 4, "all");
  const activeSheet = getMediaRule(sheet, 5, "all");

  const keyframesNames = new Set<string>();
  const resetClassNames = new Set<string>();
  const atomicClassNames = new Map<string, string | undefined>();
  const hoverClassNames = new Map<string, string | undefined>();
  const focusClassNames = new Map<string, string | undefined>();
  const activeClassNames = new Map<string, string | undefined>();

  // Rehydrate keyframes sheet

  for (const rule of keyframesSheet.cssRules) {
    if (rule instanceof CSSKeyframesRule) {
      keyframesNames.add(rule.name);
    }
  }

  // Rehydrate reset sheet
  for (const rule of resetSheet.cssRules) {
    if (rule instanceof CSSStyleRule) {
      resetClassNames.add(getClassName(rule));
    }
  }

  // Rehydrate atomic sheet
  for (const rule of atomicSheet.cssRules) {
    if (rule instanceof CSSStyleRule) {
      atomicClassNames.set(getClassName(rule), rule.style[0]);
    }
  }

  // Rehydrate hover sheet
  for (const rule of hoverSheet.cssRules) {
    if (rule instanceof CSSStyleRule) {
      hoverClassNames.set(getClassName(rule), rule.style[0]);
    }
  }

  // Rehydrate focus sheet
  for (const rule of focusSheet.cssRules) {
    if (rule instanceof CSSStyleRule) {
      focusClassNames.set(getClassName(rule), rule.style[0]);
    }
  }

  // Rehydrate active sheet
  for (const rule of activeSheet.cssRules) {
    if (rule instanceof CSSStyleRule) {
      activeClassNames.set(getClassName(rule), rule.style[0]);
    }
  }

  const insertKeyframes = (keyframes: Keyframes): string | undefined => {
    let body = "";

    forEach(keyframes, (key, value) => {
      const rules: string[] = [];

      forEach(value, (key, value) => {
        rules.push(stringifyRule(key, value));
      });

      body += `${key}{${rules.join(";")}}`;
    });

    const name = "k-" + hash(body);

    if (!keyframesNames.has(name)) {
      keyframesSheet.insertRule(`@keyframes ${name}{${body}}`);
      keyframesNames.add(name);
    }

    return name;
  };

  const insertResetRule = (style: FlatStyle): string => {
    const rules: string[] = [];

    forEach(style, (key, value) => {
      rules.push(stringifyRule(key, value));
    });

    const body = rules.join(";");
    const className = "r-" + hash(body);

    if (!resetClassNames.has(className)) {
      resetSheet.insertRule(`.${className}{${body}}`);
      resetClassNames.add(className);
    }

    return className;
  };

  const insertAtomicRules = (style: Style): string => {
    let classNames = "";

    forEach(style, (key, value) => {
      if (key === ":hover") {
        forEach(value as FlatStyle, (key, value) => {
          const rule = stringifyRule(key, value);
          const className = "h-" + hash(rule);

          if (!hoverClassNames.has(className)) {
            hoverSheet.insertRule(`.${className}:hover{${rule}}`);
            hoverClassNames.set(className, key);
          }

          classNames = appendString(classNames, className);
        });
      } else if (key === ":focus") {
        forEach(value as FlatStyle, (key, value) => {
          const rule = stringifyRule(key, value);
          const className = "f-" + hash(rule);

          if (!focusClassNames.has(className)) {
            focusSheet.insertRule(`.${className}:focus-visible{${rule}}`);
            focusClassNames.set(className, key);
          }

          classNames = appendString(classNames, className);
        });
      } else if (key === ":active") {
        forEach(value as FlatStyle, (key, value) => {
          const rule = stringifyRule(key, value);
          const className = "a-" + hash(rule);

          if (!activeClassNames.has(className)) {
            activeSheet.insertRule(`.${className}:active{${rule}}`);
            activeClassNames.set(className, key);
          }

          classNames = appendString(classNames, className);
        });
      } else {
        const rule = stringifyRule(key, value as string | number);
        const className = "x-" + hash(rule);

        if (!atomicClassNames.has(className)) {
          atomicSheet.insertRule(`.${className}{${rule}}`);
          atomicClassNames.set(className, key);
        }

        classNames = appendString(classNames, className);
      }
    });

    return classNames;
  };

  const cx = (...items: ClassNames): string => {
    const classNames = extractClassNames(items, []);

    let output = "";

    let cacheKey: string | undefined = undefined;
    let reset: string | undefined = undefined;

    const atomic: Record<string, string> = {};
    const hover: Record<string, string> = {};
    const focus: Record<string, string> = {};
    const active: Record<string, string> = {};

    for (const className of classNames) {
      cacheKey = atomicClassNames.get(className);

      if (cacheKey != null) {
        atomic[cacheKey] = className;
        continue;
      }

      cacheKey = hoverClassNames.get(className);

      if (cacheKey != null) {
        hover[cacheKey] = className;
        continue;
      }

      cacheKey = focusClassNames.get(className);

      if (cacheKey != null) {
        focus[cacheKey] = className;
        continue;
      }

      cacheKey = activeClassNames.get(className);

      if (cacheKey != null) {
        active[cacheKey] = className;
        continue;
      }

      if (resetClassNames.has(className)) {
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

  return {
    insertKeyframes,
    insertResetRule,
    insertAtomicRules,

    cx,
  };
};
