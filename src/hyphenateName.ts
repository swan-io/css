// https://github.com/facebook/react/blob/v19.0.0/packages/react-dom-bindings/src/shared/hyphenateStyleName.js

import { memoizeOne } from "./utils";

const uppercasePattern = /([A-Z])/g;

export const hyphenateName = memoizeOne((name: string): string =>
  name.replace(uppercasePattern, "-$1").toLowerCase(),
);
