import type * as CSS from "csstype";

type Length = number | (string & {});

type ExcludedValue =
  | CSS.Globals
  | CSS.DataType.DeprecatedSystemColor
  | `-moz-${string}`
  | `-ms-${string}`
  | `-webkit-${string}`;

type Simplify<T> = {
  [K in keyof T]: Exclude<T[K], ExcludedValue>;
} & {};

export type ValueOf<T> = T[keyof T];

type ShorthandProperties = Pick<
  CSS.StandardShorthandProperties<Length>,
  | "backgroundPosition"
  | "borderColor"
  | "borderRadius"
  | "borderStyle"
  | "borderWidth"
  | "gap"
  | "inset"
  | "insetBlock"
  | "insetInline"
  | "margin"
  | "marginBlock"
  | "marginInline"
  | "overflow"
  | "overscrollBehavior"
  | "padding"
  | "paddingBlock"
  | "paddingInline"
  | "scrollMarginBlock"
  | "scrollMarginInline"
  | "scrollPaddingBlock"
  | "scrollPaddingInline"
> & {
  /**
   * The **`flex`** CSS shorthand property sets how a flex _item_ will grow or shrink to fit the space available in its flex container.
   *
   * **Syntax**: `<number>`
   *
   * |  Chrome  | Firefox | Safari  |  Edge  |    IE    |
   * | :------: | :-----: | :-----: | :----: | :------: |
   * |  **29**  | **20**  |  **9**  | **12** |  **11**  |
   *
   * @see https://developer.mozilla.org/docs/Web/CSS/flex
   */
  flex?: number;
  /**
   * The **`margin-horizontal`** CSS property is a non-standard shorthand property that defines both the left and right margins of an element.
   *
   * **Syntax**: `<length> | <percentage> | auto`
   *
   * **Initial value**: `0`
   *
   * | Chrome | Firefox | Safari |  Edge  |  IE   |
   * | :----: | :-----: | :----: | :----: | :---: |
   * | **1**  |  **1**  | **1**  | **12** | **3** |
   */
  marginHorizontal?: CSS.Property.MarginInline<Length>;
  /**
   * The **`margin-vertical`** CSS property is a non-standard shorthand property that defines both the top and bottom margins of an element.
   *
   * **Syntax**: `<length> | <percentage> | auto`
   *
   * **Initial value**: `0`
   *
   * | Chrome | Firefox | Safari |  Edge  |  IE   |
   * | :----: | :-----: | :----: | :----: | :---: |
   * | **1**  |  **1**  | **1**  | **12** | **3** |
   */
  marginVertical?: CSS.Property.MarginBlock<Length>;
  /**
   * The **`padding-horizontal`** CSS property is a non-standard shorthand property that defines both the left and right paddings of an element.
   *
   * **Syntax**: `<length> | <percentage> | auto`
   *
   * **Initial value**: `0`
   *
   * | Chrome | Firefox | Safari |  Edge  |  IE   |
   * | :----: | :-----: | :----: | :----: | :---: |
   * | **1**  |  **1**  | **1**  | **12** | **4** |
   */
  paddingHorizontal?: CSS.Property.PaddingInline<Length>;
  /**
   * The **`padding-vertical`** CSS property is a non-standard shorthand property that defines both the top and bottom paddings of an element.
   *
   * **Syntax**: `<length> | <percentage> | auto`
   *
   * **Initial value**: `0`
   *
   * | Chrome | Firefox | Safari |  Edge  |  IE   |
   * | :----: | :-----: | :----: | :----: | :---: |
   * | **1**  |  **1**  | **1**  | **12** | **4** |
   */
  paddingVertical?: CSS.Property.PaddingBlock<Length>;
};

type LonghandProperties = CSS.StandardLonghandProperties<Length> & {
  /**
   * The **`line-clamp`** CSS property allows limiting of the contents of a block to the specified number of lines.
   *
   * **Syntax**: `none | <integer>`
   *
   * **Initial value**: `none`
   */
  lineClamp?: CSS.Property.WebkitLineClamp;
};

export type ShorthandProperty = keyof ShorthandProperties;
export type LonghandProperty = keyof LonghandProperties;

export type FlatStyle = Simplify<
  ShorthandProperties & LonghandProperties & CSS.SvgProperties<Length>
>;

export type Property = keyof FlatStyle;

export type Style = FlatStyle & {
  ":hover"?: FlatStyle;
  ":focus"?: FlatStyle;
  ":active"?: FlatStyle;
};

export type Keyframe = "from" | "to" | `${number}%`;
export type Keyframes = Partial<Record<Keyframe, FlatStyle | undefined>>;

// From react-native StyleSheet.d.ts
type Falsy = undefined | null | false;

interface RecursiveArray<T>
  extends Array<T | readonly T[] | RecursiveArray<T>> {}

export type ClassNames = RecursiveArray<string | Falsy>;
