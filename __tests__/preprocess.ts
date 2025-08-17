import { expect, test } from "vitest";
import { css } from "../src";
import { getSheets } from "./utils";

test("longhands properties are expanded", () => {
  const sheet = css.make({
    box: {
      backgroundPosition: "top",
      borderColor: "red",
      borderRadius: 4,
      borderStyle: "dotted",
      borderWidth: 2,
      flex: 1,
      inset: 10,
      margin: 10,
      padding: 10,
    },
  });

  expect(sheet.box).toMatchInlineSnapshot(
    `"x-hxcezg x-1dfi33a x-1dn2v7r x-iv1f9g x-t2os1t x-3fjowq x-saweta x-1ii3byr x-y0xjo x-1tpfb5e x-1heflbf x-vmvve5 x-1dwkzv9 x-w9ka61 x-yy91wp x-1hkda0i x-1f4na1f x-1w0py0o x-i9gxme x-6voltb x-or3kd5 x-1tetg17 x-1yirz4a x-h4b6im x-1rs1pq0 x-1q7njkh x-lvyu5j x-1r2f04i x-1y6ic72 x-542elh x-1p2jtab x-l57rop x-m6sx0v"`,
  );

  const { atomic } = getSheets();

  expect(atomic.rules.join("\n")).toMatchInlineSnapshot(`
    ".x-hxcezg { background-position-x: 50%; }
    .x-1dfi33a { background-position-y: 0%; }
    .x-1dn2v7r { border-top-color: rgb(255, 0, 0); }
    .x-iv1f9g { border-right-color: rgb(255, 0, 0); }
    .x-t2os1t { border-bottom-color: rgb(255, 0, 0); }
    .x-3fjowq { border-left-color: rgb(255, 0, 0); }
    .x-saweta { border-top-left-radius: 4px; }
    .x-1ii3byr { border-top-right-radius: 4px; }
    .x-y0xjo { border-bottom-right-radius: 4px; }
    .x-1tpfb5e { border-bottom-left-radius: 4px; }
    .x-1heflbf { border-top-style: dotted; }
    .x-vmvve5 { border-right-style: dotted; }
    .x-1dwkzv9 { border-bottom-style: dotted; }
    .x-w9ka61 { border-left-style: dotted; }
    .x-yy91wp { border-top-width: 2px; }
    .x-1hkda0i { border-right-width: 2px; }
    .x-1f4na1f { border-bottom-width: 2px; }
    .x-1w0py0o { border-left-width: 2px; }
    .x-i9gxme { flex-grow: 1; }
    .x-6voltb { flex-shrink: 1; }
    .x-or3kd5 { flex-basis: 0%; }
    .x-1tetg17 { top: 10px; }
    .x-1yirz4a { right: 10px; }
    .x-h4b6im { bottom: 10px; }
    .x-1rs1pq0 { left: 10px; }
    .x-1q7njkh { margin-top: 10px; }
    .x-lvyu5j { margin-right: 10px; }
    .x-1r2f04i { margin-bottom: 10px; }
    .x-1y6ic72 { margin-left: 10px; }
    .x-542elh { padding-top: 10px; }
    .x-1p2jtab { padding-right: 10px; }
    .x-l57rop { padding-bottom: 10px; }
    .x-m6sx0v { padding-left: 10px; }"
  `);
});
