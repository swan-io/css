export const getElementStyle = (element: Element): Record<string, string> => {
  const styleMap: Record<string, string> = {};

  for (const [key, item] of element.computedStyleMap()) {
    const value = [...item][0]?.toString();

    if (value != null) {
      styleMap[key] = value;
    }
  }

  return styleMap;
};

export const getSheet = (): CSSStyleSheet => {
  const sheet = document.querySelector<HTMLStyleElement>(
    `style[id="swan-stylesheet"]`,
  )?.sheet;

  if (sheet == null) {
    throw new Error("CSSStyleSheet instance not found");
  }

  return sheet;
};
