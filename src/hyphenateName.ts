// https://github.com/facebook/react/blob/v19.0.0/packages/react-dom-bindings/src/shared/hyphenateStyleName.js

const uppercasePattern = /([A-Z])/g;
const hyphenateNameCache: Record<string, string> = {};

export const hyphenateName = (name: string): string => {
  hyphenateNameCache[name] ??= name
    .replace(uppercasePattern, "-$1")
    .toLowerCase();

  return hyphenateNameCache[name];
};
