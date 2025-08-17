import { expect, test } from "vitest";
import { css } from "../src";
import { getSheets } from "./utils";

test("sheet create and use different subsheets", async () => {
  css.make({
    $reset: {
      display: "flex",
      width: 100,
      height: 100,
    },
    box: {
      animationDuration: "200ms",
      backgroundColor: "white",
      color: "red",

      animationName: css.keyframes({
        from: { opacity: 0 },
        to: { opacity: 1 },
      }),

      ":hover": { color: "green" },
      ":focus": { color: "blue" },
      ":active": { color: "rebeccapurple" },
    },
  });

  const { main, keyframes, reset, atomic, hover, focus, active } = getSheets();

  expect(keyframes.media).toBe("all");
  expect(reset.media).toBe("all");
  expect(atomic.media).toBe("all");
  expect(hover.media).toBe("(hover: hover)");
  expect(focus.media).toBe("all");
  expect(active.media).toBe("all");

  expect(main.rules).toHaveLength(6);
  expect(keyframes.rules).toHaveLength(1);
  expect(reset.rules).toHaveLength(1);
  expect(atomic.rules).toHaveLength(4);
  expect(hover.rules).toHaveLength(1);
  expect(focus.rules).toHaveLength(1);
  expect(active.rules).toHaveLength(1);

  expect(keyframes.rules.join("\n")).toMatchInlineSnapshot(
    `"@keyframes k-g03ymi { 0% { opacity: 0; } 100% { opacity: 1; } }"`,
  );

  expect(reset.rules.join("\n")).toMatchInlineSnapshot(
    `".r-1lz55j3 { display: flex; width: 100px; height: 100px; }"`,
  );

  expect(atomic.rules.join("\n")).toMatchInlineSnapshot(`
    ".x-dor4jq { animation-duration: 200ms; }
    .x-dfjll8 { background-color: rgb(255, 255, 255); }
    .x-16n2zqk { color: rgb(255, 0, 0); }
    .x-rtk404 { animation-name: k-g03ymi; }"
  `);

  expect(hover.rules.join("\n")).toMatchInlineSnapshot(
    `".h-14zmu5o:hover { color: rgb(0, 128, 0); }"`,
  );

  expect(focus.rules.join("\n")).toMatchInlineSnapshot(
    `".f-1szktvb:focus-visible { color: rgb(0, 0, 255); }"`,
  );

  expect(active.rules.join("\n")).toMatchInlineSnapshot(
    `".a-a2elq4:active { color: rgb(102, 51, 153); }"`,
  );
});
