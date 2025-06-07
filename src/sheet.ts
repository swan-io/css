import { hash } from "./hash";
import { hyphenateName } from "./hyphenateName";
import { normalizeValue } from "./normalizeValue";
import type { ClassNames, Keyframes, Nestable, Style } from "./types";
import { forEach } from "./utils";

const getSheet = (id: string): CSSStyleSheet | null => {
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
): CSSMediaRule | undefined => {
  if (sheet == null) {
    return;
  }

  const current = sheet.cssRules[index];

  if (current != null) {
    return current as CSSMediaRule;
  }

  try {
    sheet.insertRule(`@media ${media} {}`, index);
    return sheet.cssRules[index] as CSSMediaRule;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }
};

const insertRule = (sheet: CSSMediaRule, rule: string): void => {
  try {
    sheet.insertRule(rule, sheet.cssRules.length);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }
};

const stringifyRule = (key: string, value: string | number): string => {
  if (key === "appearance") {
    return `-webkit-appearance: ${value}; appearance: ${value};`;
  }
  if (key === "lineClamp") {
    return `-webkit-line-clamp: ${value}; line-clamp: ${value};`;
  }

  return `${hyphenateName(key)}: ${normalizeValue(key, value)};`;
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
  const hoverSheet = getMediaRule(sheet, 3, "(hover: hover)");
  const focusSheet = getMediaRule(sheet, 4, "all");
  const activeSheet = getMediaRule(sheet, 5, "all");

  const keyframesNames = new Set<string>();
  const resetClassNames = new Set<string>();
  const atomicClassNames = new Map<string, string | undefined>();
  const hoverClassNames = new Map<string, string | undefined>();
  const focusClassNames = new Map<string, string | undefined>();
  const activeClassNames = new Map<string, string | undefined>();

  // Rehydrate keyframes sheet
  if (keyframesSheet != null) {
    for (const rule of keyframesSheet.cssRules) {
      if (rule instanceof CSSKeyframesRule) {
        keyframesNames.add(rule.name);
      }
    }
  }

  // Rehydrate reset sheet
  if (resetSheet != null) {
    for (const rule of resetSheet.cssRules) {
      if (rule instanceof CSSStyleRule) {
        resetClassNames.add(getClassName(rule));
      }
    }
  }

  // Rehydrate atomic sheet
  if (atomicSheet != null) {
    for (const rule of atomicSheet.cssRules) {
      if (rule instanceof CSSStyleRule) {
        atomicClassNames.set(getClassName(rule), rule.style[0]);
      }
    }
  }

  // Rehydrate hover sheet
  if (hoverSheet != null) {
    for (const rule of hoverSheet.cssRules) {
      if (rule instanceof CSSStyleRule) {
        hoverClassNames.set(getClassName(rule), rule.style[0]);
      }
    }
  }

  // Rehydrate focus sheet
  if (focusSheet != null) {
    for (const rule of focusSheet.cssRules) {
      if (rule instanceof CSSStyleRule) {
        focusClassNames.set(getClassName(rule), rule.style[0]);
      }
    }
  }

  // Rehydrate active sheet
  if (activeSheet != null) {
    for (const rule of activeSheet.cssRules) {
      if (rule instanceof CSSStyleRule) {
        activeClassNames.set(getClassName(rule), rule.style[0]);
      }
    }
  }

  const insertKeyframes = (keyframes: Keyframes): string | undefined => {
    if (keyframesSheet == null) {
      return;
    }

    let body = "";

    forEach(keyframes, (key, value) => {
      let rules = "";

      forEach(value, (key, value) => {
        rules = appendString(rules, stringifyRule(key, value));
      });

      body = appendString(body, `${key} { ${rules} }`);
    });

    const name = "k-" + hash(body);

    if (!keyframesNames.has(name)) {
      insertRule(keyframesSheet, `@keyframes ${name} { ${body} }`);
      keyframesNames.add(name);
    }

    return name;
  };

  const insertResetRule = (style: Style): string => {
    if (resetSheet == null) {
      return "";
    }

    let rules = "";

    forEach(style, (key, value) => {
      rules = appendString(rules, stringifyRule(key, value));
    });

    const className = "r-" + hash(rules);

    if (!resetClassNames.has(className)) {
      insertRule(resetSheet, `.${className} { ${rules} }`);
      resetClassNames.add(className);
    }

    return className;
  };

  const insertAtomicRules = (style: Nestable<Style>): string => {
    let classNames = "";

    if (
      atomicSheet == null ||
      hoverSheet == null ||
      focusSheet == null ||
      activeSheet == null
    ) {
      return classNames;
    }

    forEach(style, (key, value) => {
      if (key === ":hover") {
        forEach(value as Style, (key, value) => {
          const rule = stringifyRule(key, value);
          const className = "h-" + hash(rule);

          if (!hoverClassNames.has(className)) {
            insertRule(hoverSheet, `.${className}:hover { ${rule} }`);
            hoverClassNames.set(className, key);
          }

          classNames = appendString(classNames, className);
        });
      } else if (key === ":focus") {
        forEach(value as Style, (key, value) => {
          const rule = stringifyRule(key, value);
          const className = "f-" + hash(rule);

          if (!focusClassNames.has(className)) {
            insertRule(focusSheet, `.${className}:focus-visible { ${rule} }`);
            focusClassNames.set(className, key);
          }

          classNames = appendString(classNames, className);
        });
      } else if (key === ":active") {
        forEach(value as Style, (key, value) => {
          const rule = stringifyRule(key, value);
          const className = "a-" + hash(rule);

          if (!activeClassNames.has(className)) {
            insertRule(activeSheet, `.${className}:active { ${rule} }`);
            activeClassNames.set(className, key);
          }

          classNames = appendString(classNames, className);
        });
      } else {
        const rule = stringifyRule(key, value as string | number);
        const className = "x-" + hash(rule);

        if (!atomicClassNames.has(className)) {
          insertRule(atomicSheet, `.${className} { ${rule} }`);
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
    let reset: string | undefined = undefined;

    const atomic: Record<string, string> = {};
    const hover: Record<string, string> = {};
    const focus: Record<string, string> = {};
    const active: Record<string, string> = {};

    for (const className of classNames) {
      if (atomicClassNames.has(className)) {
        atomic[atomicClassNames.get(className) as string] = className;
      } else if (hoverClassNames.has(className)) {
        hover[hoverClassNames.get(className) as string] = className;
      } else if (focusClassNames.has(className)) {
        focus[focusClassNames.get(className) as string] = className;
      } else if (activeClassNames.has(className)) {
        active[activeClassNames.get(className) as string] = className;
      } else if (resetClassNames.has(className)) {
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
