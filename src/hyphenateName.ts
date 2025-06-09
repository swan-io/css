// https://github.com/facebook/react/blob/v19.1.0/packages/react-dom-bindings/src/shared/hyphenateStyleName.js

import { memoize } from "./utils";

const uppercasePattern = /([A-Z])/g;

export const hyphenateName = memoize((name: string): string =>
  name.replace(uppercasePattern, "-$1").toLowerCase(),
);
