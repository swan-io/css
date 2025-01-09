const isMediaRule = (rule: CSSRule | undefined) =>
  rule != null && rule instanceof CSSMediaRule;

const convertSheet = (sheet: CSSStyleSheet | CSSMediaRule) => ({
  media: sheet.media.toString(),
  rules: [...sheet.cssRules].map((rule) => rule.cssText.replace(/\s+/g, " ")),
});

export const getSheets = () => {
  const main = document.querySelector<HTMLStyleElement>(
    `style[id="swan-stylesheet"]`,
  )?.sheet;

  if (main == null) {
    throw new Error("Cannot get main CSSStyleSheet");
  }

  const keyframes = main.cssRules[0];
  const reset = main.cssRules[1];
  const atomic = main.cssRules[2];
  const hover = main.cssRules[3];
  const focus = main.cssRules[4];
  const active = main.cssRules[5];

  if (!isMediaRule(keyframes)) {
    throw new Error("Cannot get keyframes CSSMediaRule");
  }
  if (!isMediaRule(reset)) {
    throw new Error("Cannot get reset CSSMediaRule");
  }
  if (!isMediaRule(atomic)) {
    throw new Error("Cannot get atomic CSSMediaRule");
  }
  if (!isMediaRule(hover)) {
    throw new Error("Cannot get hover CSSMediaRule");
  }
  if (!isMediaRule(focus)) {
    throw new Error("Cannot get focus CSSMediaRule");
  }
  if (!isMediaRule(active)) {
    throw new Error("Cannot get active CSSMediaRule");
  }

  return {
    main: convertSheet(main),
    keyframes: convertSheet(keyframes),
    reset: convertSheet(reset),
    atomic: convertSheet(atomic),
    hover: convertSheet(hover),
    focus: convertSheet(focus),
    active: convertSheet(active),
  };
};
