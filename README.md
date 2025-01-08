# @swan-io/css

[![mit licence](https://img.shields.io/dub/l/vibe-d.svg?style=for-the-badge)](https://github.com/swan-io/css/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/@swan-io/css?style=for-the-badge)](https://www.npmjs.org/package/@swan-io/css)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/@swan-io/css?label=size&style=for-the-badge)](https://bundlephobia.com/result?p=@swan-io/css)

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

Create a new sheet object.

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

console.log(sheet.box); // a string list of generated classes
```

> [!TIP]
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

### css.keyframes

Injects a keyframes rule and generates a unique name for it.

```tsx
const sheet = css.make({
  box: {
    animationDuration: "300ms",
    animationName: css.keyframes({
      "0%": { opacity: 0 },
      "100%": { opacity: 1 },
    }),
  },
});
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

## Links

- ⚖️ [**License**](./LICENSE)

## 🙌 Acknowledgements

- [react-native-web](https://github.com/necolas/react-native-web) by [@necolas](https://github.com/necolas)
