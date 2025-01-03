import valueParser from "postcss-value-parser";
import {
  Keyframes,
  LonghandProperty,
  Nestable,
  Property,
  ShorthandProperty,
  Style,
  ValueOf,
} from "./types";
import { forEach } from "./utils";

const shorthands: Partial<Record<Property, Property[]>> = {
  borderColor: [
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
  ],
  borderRadius: [
    "borderTopLeftRadius",
    "borderTopRightRadius",
    "borderBottomRightRadius",
    "borderBottomLeftRadius",
  ],
  borderStyle: [
    "borderTopStyle",
    "borderRightStyle",
    "borderBottomStyle",
    "borderLeftStyle",
  ],
  borderWidth: [
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
  ],
  gap: ["rowGap", "columnGap"],
  inset: ["top", "right", "bottom", "left"],
  insetBlock: ["insetBlockStart", "insetBlockEnd"],
  insetInline: ["insetInlineStart", "insetInlineEnd"],
  margin: ["marginTop", "marginRight", "marginBottom", "marginLeft"],
  marginBlock: ["marginBlockStart", "marginBlockEnd"],
  marginHorizontal: ["marginRight", "marginLeft"],
  marginInline: ["marginInlineStart", "marginInlineEnd"],
  marginVertical: ["marginTop", "marginBottom"],
  overflow: ["overflowX", "overflowY"],
  overscrollBehavior: ["overscrollBehaviorX", "overscrollBehaviorY"],
  padding: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"],
  paddingBlock: ["paddingBlockStart", "paddingBlockEnd"],
  paddingHorizontal: ["paddingRight", "paddingLeft"],
  paddingInline: ["paddingInlineStart", "paddingInlineEnd"],
  paddingVertical: ["paddingTop", "paddingBottom"],
  scrollMarginBlock: ["scrollMarginBlockStart", "scrollMarginBlockEnd"],
  scrollMarginInline: ["scrollMarginInlineStart", "scrollMarginInlineEnd"],
  scrollPaddingBlock: ["scrollPaddingBlockStart", "scrollPaddingBlockEnd"],
  scrollPaddingInline: ["scrollPaddingInlineStart", "scrollPaddingInlineEnd"],
} satisfies Record<
  Exclude<ShorthandProperty, "backgroundPosition" | "flex">,
  LonghandProperty[]
>;

const preprocessRule = (
  acc: Style,
  key: Property,
  value: ValueOf<Style>,
): void => {
  if (value != null) {
    const shorthand = shorthands[key];

    if (shorthand != null) {
      for (const longhand of shorthand) {
        // @ts-expect-error
        acc[longhand] = value;
      }
    } else if (key === "backgroundPosition") {
      if (value !== "top" && value !== "bottom") {
        acc.backgroundPositionX = value;
      }
      if (value !== "left" && value !== "right") {
        acc.backgroundPositionY = value;
      }
    } else if (key === "flex") {
      if (typeof value === "number" && value >= 0 && Number.isFinite(value)) {
        acc.flexGrow = value;
        acc.flexShrink = 1;
        acc.flexBasis = "0%";
      }
    } else {
      // @ts-expect-error
      acc[key] = value;
    }

    if (process.env.NODE_ENV === "development") {
      if (
        (shorthand != null || key === "backgroundPosition" || key === "flex") &&
        typeof value === "string" &&
        valueParser(value).nodes.length > 1
      ) {
        console.warn(
          `Value is "${value}" but only single values are supported.`,
        );
      }
    }
  }
};

const preprocessStyle = (style: Style): Style => {
  const output: Style = {};

  forEach(style, (key, value) => {
    preprocessRule(output, key, value);
  });

  return output;
};

export const preprocessKeyframes = (keyframes: Keyframes): Keyframes => {
  const output: Keyframes = {};

  forEach(keyframes, (keyframe, value) => {
    output[keyframe === "from" ? "0%" : keyframe === "to" ? "100%" : keyframe] =
      preprocessStyle(value);
  });

  return output;
};

export const preprocessResetStyle = (style: Nestable<Style>): Style => {
  const output: Style = {};

  forEach(style, (key, value) => {
    if (key === ":hover" || key === ":focus" || key === ":active") {
      if (process.env.NODE_ENV === "development") {
        console.warn(`"${key}" is not supported in reset styles.`);
      }
    } else {
      preprocessRule(output, key, value as ValueOf<Style>);
    }
  });

  return output;
};

export const preprocessAtomicStyle = (
  style: Nestable<Style>,
): Nestable<Style> => {
  const output: Nestable<Style> = {};

  let hover: Style | undefined = undefined;
  let focus: Style | undefined = undefined;
  let active: Style | undefined = undefined;

  forEach(style, (key, value) => {
    if (key === ":hover") {
      hover = preprocessStyle(value as Style);
    } else if (key === ":focus") {
      focus = preprocessStyle(value as Style);
    } else if (key === ":active") {
      active = preprocessStyle(value as Style);
    } else {
      preprocessRule(output, key, value as ValueOf<Style>);
    }
  });

  // Keep :hover / :focus / :active ordered
  if (hover != null) {
    output[":hover"] = hover;
  }
  if (focus != null) {
    output[":focus"] = focus;
  }
  if (active != null) {
    output[":active"] = active;
  }

  return output;
};
