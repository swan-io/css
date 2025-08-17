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
    `"x-lfc3u x-t2c4xk x-pkmt3d x-i4uh46 x-8ax2ix x-cw8oq x-xarb4h x-csbtkn x-19qf5c9 x-19zmm9e x-redm21 x-1z0iz6v x-1k33e1u x-17lowmk x-1vb4y5s x-1o1hnd4 x-1r6o6ls x-mtaiak x-1ff36h2 x-s2a4s9 x-v6p07m x-1j54aji x-9q1moj x-74v7ed x-yp89se x-1r0yqr6 x-nkt64x x-pr10xp x-1a2afmv x-icns00 x-qzmnd2 x-1yaiq4p x-vnst0l"`,
  );

  const { atomic } = getSheets();

  expect(atomic.rules.join("\n")).toMatchInlineSnapshot(`
    ".x-lfc3u { background-position-x: 50%; }
    .x-t2c4xk { background-position-y: 0%; }
    .x-pkmt3d { border-top-color: rgb(255, 0, 0); }
    .x-i4uh46 { border-right-color: rgb(255, 0, 0); }
    .x-8ax2ix { border-bottom-color: rgb(255, 0, 0); }
    .x-cw8oq { border-left-color: rgb(255, 0, 0); }
    .x-xarb4h { border-top-left-radius: 4px; }
    .x-csbtkn { border-top-right-radius: 4px; }
    .x-19qf5c9 { border-bottom-right-radius: 4px; }
    .x-19zmm9e { border-bottom-left-radius: 4px; }
    .x-redm21 { border-top-style: dotted; }
    .x-1z0iz6v { border-right-style: dotted; }
    .x-1k33e1u { border-bottom-style: dotted; }
    .x-17lowmk { border-left-style: dotted; }
    .x-1vb4y5s { border-top-width: 2px; }
    .x-1o1hnd4 { border-right-width: 2px; }
    .x-1r6o6ls { border-bottom-width: 2px; }
    .x-mtaiak { border-left-width: 2px; }
    .x-1ff36h2 { flex-grow: 1; }
    .x-s2a4s9 { flex-shrink: 1; }
    .x-v6p07m { flex-basis: 0%; }
    .x-1j54aji { top: 10px; }
    .x-9q1moj { right: 10px; }
    .x-74v7ed { bottom: 10px; }
    .x-yp89se { left: 10px; }
    .x-1r0yqr6 { margin-top: 10px; }
    .x-nkt64x { margin-right: 10px; }
    .x-pr10xp { margin-bottom: 10px; }
    .x-1a2afmv { margin-left: 10px; }
    .x-icns00 { padding-top: 10px; }
    .x-qzmnd2 { padding-right: 10px; }
    .x-1yaiq4p { padding-bottom: 10px; }
    .x-vnst0l { padding-left: 10px; }"
  `);
});
