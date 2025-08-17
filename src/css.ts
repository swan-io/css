import { caches } from "./cx";
import { hash } from "./hash";
import { hyphenateName } from "./hyphenateName";
import { normalizeValue } from "./normalizeValue";
import {
  preprocessAtomicStyle,
  preprocessKeyframes,
  preprocessResetStyle,
} from "./preprocess";
import type { FlatStyle, Input, Keyframes, Style } from "./types";
import { appendString, forEach } from "./utils";

const getSheet = (id: string): CSSStyleSheet | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const current =
    document.querySelector<HTMLLinkElement>(`link[id="${id}"]`) ??
    document.querySelector<HTMLStyleElement>(`style[id="${id}"]`);

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
  toString: () => string;
  insertRule: (rule: string) => void;
} => {
  const cssRules = new Set<string>();

  const toString = () =>
    cssRules.size > 0
      ? `@media ${media}{${[...cssRules].join("")}}`
      : `@media ${media}{}`; // Keep an empty media sheet to preserve the index (hydratation)

  if (sheet == null) {
    return {
      cssRules: [],
      toString,
      insertRule: (rule) => {
        cssRules.add(rule);
      },
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
        toString,
        insertRule: (rule) => {
          cssRules.add(rule);
        },
      };
    }
  }

  const mediaRule = sheet.cssRules[index] as CSSMediaRule;

  return {
    cssRules: mediaRule.cssRules,
    toString,
    insertRule: (rule) => {
      try {
        mediaRule.insertRule(rule, mediaRule.cssRules.length);
        cssRules.add(rule);
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

const getClassName = (rule: CSSStyleRule): string => {
  const selector = rule.selectorText;
  const end = selector.indexOf(":");
  return end > -1 ? selector.substring(1, end) : selector.substring(1);
};

const sheet = getSheet("swan-stylesheet");

const keyframesSheet = getMediaRule(sheet, 0, "all");
const resetSheet = getMediaRule(sheet, 1, "all");
const atomicSheet = getMediaRule(sheet, 2, "all");
const hoverSheet = getMediaRule(sheet, 3, "(hover:hover)");
const focusSheet = getMediaRule(sheet, 4, "all");
const activeSheet = getMediaRule(sheet, 5, "all");

const keyframesNames = new Set<string>();

// Rehydrate keyframes sheet
for (const rule of keyframesSheet.cssRules) {
  if (rule instanceof CSSKeyframesRule) {
    keyframesNames.add(rule.name);
  }
}

// Rehydrate reset sheet
for (const rule of resetSheet.cssRules) {
  if (rule instanceof CSSStyleRule) {
    caches.reset.add(getClassName(rule));
  }
}

// Rehydrate atomic sheet
for (const rule of atomicSheet.cssRules) {
  if (rule instanceof CSSStyleRule) {
    caches.atomic.set(getClassName(rule), rule.style[0]);
  }
}

// Rehydrate hover sheet
for (const rule of hoverSheet.cssRules) {
  if (rule instanceof CSSStyleRule) {
    caches.hover.set(getClassName(rule), rule.style[0]);
  }
}

// Rehydrate focus sheet
for (const rule of focusSheet.cssRules) {
  if (rule instanceof CSSStyleRule) {
    caches.focus.set(getClassName(rule), rule.style[0]);
  }
}

// Rehydrate active sheet
for (const rule of activeSheet.cssRules) {
  if (rule instanceof CSSStyleRule) {
    caches.active.set(getClassName(rule), rule.style[0]);
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

  if (!caches.reset.has(className)) {
    resetSheet.insertRule(`.${className}{${body}}`);
    caches.reset.add(className);
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

        if (!caches.hover.has(className)) {
          hoverSheet.insertRule(`.${className}:hover{${rule}}`);
          caches.hover.set(className, key);
        }

        classNames = appendString(classNames, className);
      });
    } else if (key === ":focus") {
      forEach(value as FlatStyle, (key, value) => {
        const rule = stringifyRule(key, value);
        const className = "f-" + hash(rule);

        if (!caches.focus.has(className)) {
          focusSheet.insertRule(`.${className}:focus-visible{${rule}}`);
          caches.focus.set(className, key);
        }

        classNames = appendString(classNames, className);
      });
    } else if (key === ":active") {
      forEach(value as FlatStyle, (key, value) => {
        const rule = stringifyRule(key, value);
        const className = "a-" + hash(rule);

        if (!caches.active.has(className)) {
          activeSheet.insertRule(`.${className}:active{${rule}}`);
          caches.active.set(className, key);
        }

        classNames = appendString(classNames, className);
      });
    } else {
      const rule = stringifyRule(key, value as string | number);
      const className = "x-" + hash(rule);

      if (!caches.atomic.has(className)) {
        atomicSheet.insertRule(`.${className}{${rule}}`);
        caches.atomic.set(className, key);
      }

      classNames = appendString(classNames, className);
    }
  });

  return classNames;
};

export const cssMakeInput: Input = {
  keyframes: (keyframes) => insertKeyframes(preprocessKeyframes(keyframes)),
};

export const css = {
  extend: <const T extends Record<string, unknown>>(input: T) => {
    forEach(input, (key, value) => {
      // @ts-expect-error keep initial object instance reference
      cssMakeInput[key] = value;
    });

    return input;
  },
  make: <K extends string>(
    styles: Record<K, Style> | ((input: Input) => Record<K, Style>),
  ): Record<K, string> => {
    const output = {} as Record<K, string>;

    forEach(
      typeof styles === "function" ? styles(cssMakeInput) : styles,
      (key, value) => {
        output[key] =
          key[0] === "$"
            ? insertResetRule(preprocessResetStyle(value))
            : insertAtomicRules(preprocessAtomicStyle(value));
      },
    );

    return output;
  },
};

export const getCssFileContent = () =>
  [
    keyframesSheet.toString(),
    resetSheet.toString(),
    atomicSheet.toString(),
    hoverSheet.toString(),
    focusSheet.toString(),
    activeSheet.toString(),
  ].join("\n");
