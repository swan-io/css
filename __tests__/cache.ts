import { expect, test } from "vitest";
import { css } from "../src";
import { getSheets } from "./utils";

test("cache don't insert identical property + value pairs", () => {
  css.make({
    foo: {
      color: "red",
      ":hover": { color: "green" },
      ":focus": { color: "blue" },
      ":active": { color: "rebeccapurple" },
    },
    bar: {
      color: "red",
      ":hover": { color: "green" },
      ":focus": { color: "blue" },
      ":active": { color: "rebeccapurple" },
    },
    baz: {
      // insert identical colors (they are normalized)
      color: "color: rgb(255, 0, 0)",
      ":hover": { color: "rgb(0, 128, 0)" },
      ":focus": { color: "rgb(0, 0, 255)" },
      ":active": { color: "rgb(102, 51, 153)" },
    },
    // insert identical resets
    $qux: { margin: 0, padding: 0 },
    $quux: { margin: 0, padding: 0 },
  });

  const { reset, atomic, hover, focus, active } = getSheets();

  expect(reset.rules).toHaveLength(1);
  expect(atomic.rules).toHaveLength(1);
  expect(hover.rules).toHaveLength(1);
  expect(focus.rules).toHaveLength(1);
  expect(active.rules).toHaveLength(1);

  expect(reset.rules.join("\n")).toMatchInlineSnapshot(
    `".r-exbvf9 { margin: 0px; padding: 0px; }"`,
  );

  expect(atomic.rules.join("\n")).toMatchInlineSnapshot(
    `".x-eu7krx { color: rgb(255, 0, 0); }"`,
  );

  expect(hover.rules.join("\n")).toMatchInlineSnapshot(
    `".h-1yatgts:hover { color: rgb(0, 128, 0); }"`,
  );

  expect(focus.rules.join("\n")).toMatchInlineSnapshot(
    `".f-1jziecw:focus-visible { color: rgb(0, 0, 255); }"`,
  );

  expect(active.rules.join("\n")).toMatchInlineSnapshot(
    `".a-lsxzvj:active { color: rgb(102, 51, 153); }"`,
  );
});
