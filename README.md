# @swan-io/css

[![mit licence](https://img.shields.io/dub/l/vibe-d.svg?style=for-the-badge)](https://github.com/swan-io/css/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/@swan-io/css?style=for-the-badge)](https://www.npmjs.org/package/@swan-io/css)

A lightweight and performant atomic CSS-in-JS library.

## Installation

```bash
$ yarn add @swan-io/css
# --- or ---
$ npm install --save @swan-io/css
```

## Quickstart

```tsx
import { css, cx } from "@swan-io/css";

const sheet = css.make({
  box: {
    backgroundColor: "blue",
    padding: 16,
  },
  large: {
    padding: 24,
  },
  text: {
    color: "white",
    fontSize: 20,
    ":hover": {
      color: "gray",
    },
  },
});

const Component = ({ large }: { large: boolean }) => (
  <div className={cx(sheet.box, large && sheet.large)}>
    <span className={sheet.text}>Hello world</span>
  </div>
);
```

## API

### css.make

Create a new sheet object and inject the associated styles.

```tsx
const sheet = css.make({
  box: {
    backgroundColor: "hotpink",
    paddingHorizontal: 16,

    // supports :hover, :focus and :active
    ":hover": { color: "red" },
    ":focus": { color: "green" },
    ":active": { color: "blue" },
  },
});

console.log(sheet.box); // space-separated string of class names
```

```tsx
const sheet = css.make(({ keyframes }) => ({
  box: {
    animationDuration: "300ms",

    // inject a keyframes rule and generate a unique name for it
    animationName: keyframes({
      "0%": { opacity: 0 },
      "100%": { opacity: 1 },
    }),
  },
}));
```

> [!NOTE]
> Styles prefixed with `$` will be inserted as non-atomic CSS-in-JS, which is particularly useful for resetting the styles of an HTML element.

```tsx
const sheet = css.make({
  // generates a single class, inserted before the rest
  $reset: {
    margin: 0,
    padding: 0,
  },
  // generates multiple classes
  input: {
    color: "grey",
    display: "flex",
  },
});
```

### css.extend

Extend `css.make` input with custom tokens (e.g. colors, spacing, fonts) / utils.

```tsx
// theme.ts
import { css } from "@swan-io/css";

const input = css.extend({
  colors: {
    red: "#fa2c37",
    blue: "#2c7fff",
    green: "#00c950",
  },
});

type CustomInput = typeof input;

declare module "@swan-io/css" {
  export interface Input extends CustomInput {}
}
```

```tsx
// main.ts
import "./theme";

import { createRoot } from "react-dom/client";
// …
```

```tsx
const sheet = css.make(({ colors }) => ({
  box: { backgroundColor: colors.blue },
}));
```

### cx

Concatenate the generated classes from left to right, with subsequent styles overwriting the property values of earlier ones.

```tsx
const sheet = css.make({
  box: {
    display: "flex",
    color: "red",
  },
  inline: {
    display: "inline-flex",
  },
});

// with inline={false}, applied style will be display: flex; color: red;
// with inline={true}, applied style will be display: inline-flex; color: red;
const Component = ({ inline }: { inline: boolean }) => (
  <div className={cx(sheet.box, inline && sheet.inline)} />
);
```

## CSS extraction

For production, we recommend enabling the Vite extraction plugin to generate a static CSS file. This removes the runtime style injection, reduces bundle size, and improves performance.

```tsx
import swanCss from "@swan-io/css/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [react(), command === "build" && swanCss()],
}));
```

## Links

- ⚖️ [**License**](./LICENSE)

## 🙌 Acknowledgements

- [react-native-web](https://github.com/necolas/react-native-web) by [@necolas](https://github.com/necolas)
