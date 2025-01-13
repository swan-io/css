import normalizeColor from "@react-native/normalize-colors";
import { Property } from "./types";
import { memoizeTwo } from "./utils";

/**
 * CSS properties which accept numbers but are not in units of "px"
 * From https://github.com/facebook/react/blob/v19.0.0/packages/react-dom-bindings/src/shared/isUnitlessNumber.js
 */
const unitlessProperties = new Set<string>([
  "animationIterationCount",
  "aspectRatio",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "columnCount",
  "flex",
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "gridColumnEnd",
  "gridColumnStart",
  "gridRowEnd",
  "gridRowStart",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "scale",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",

  // SVG-related properties
  "fillOpacity",
  "floodOpacity",
  "stopOpacity",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
] satisfies Property[]);

/**
 * From https://github.com/necolas/react-native-web/blob/0.19.13/packages/react-native-web/src/exports/StyleSheet/compiler/normalizeValueWithProperty.js#L13
 */
const colorProperties = new Set<string>([
  "backgroundColor",
  "borderBottomColor",
  "borderColor",
  "borderLeftColor",
  "borderRightColor",
  "borderTopColor",
  "color",
  "textDecorationColor",
] satisfies Property[]);

const isWebColor = (color: string): boolean =>
  color === "currentcolor" ||
  color === "currentColor" ||
  color === "inherit" ||
  color.indexOf("var(") === 0;

export const normalizeValue = memoizeTwo(
  (key: string, value: string | number): string => {
    if (typeof value === "number") {
      return unitlessProperties.has(key) ? String(value) : `${value}px`;
    }

    if (colorProperties.has(key)) {
      if (isWebColor(value)) {
        return value;
      }

      const normalizedColor = normalizeColor(value);

      if (normalizedColor != null) {
        const int = ((normalizedColor << 24) | (normalizedColor >>> 8)) >>> 0;

        const r = (int >> 16) & 255;
        const g = (int >> 8) & 255;
        const b = int & 255;
        const a = ((int >> 24) & 255) / 255;

        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
      }
    }

    return value;
  },
);
