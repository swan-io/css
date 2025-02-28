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
    `"x-fx1dzd x-8cijqb x-1gj51ll x-19tkz8q x-1ogglhr x-yx774m x-1h88r7n x-1bdvcgl x-misotl x-qirwg6 x-1ppxwh4 x-1o74rcf x-1vqxhxy x-9xwnqj x-29ghif x-1h9xl6o x-s861vp x-1a0ix0g x-fh1clx x-1t1j3t x-tklrwr x-o0zst5 x-zs882z x-4esd6u x-jwnrsh x-8wdww5 x-1f13l4q x-lx60ht x-cl7tym x-jm3jfd x-jlcvdv x-6rz8sj x-h002ba"`,
  );

  const { atomic } = getSheets();

  expect(atomic.rules.join("\n")).toMatchInlineSnapshot(`
    ".x-fx1dzd { background-position-x: 50%; }
    .x-8cijqb { background-position-y: 0%; }
    .x-1gj51ll { border-top-color: rgb(255, 0, 0); }
    .x-19tkz8q { border-right-color: rgb(255, 0, 0); }
    .x-1ogglhr { border-bottom-color: rgb(255, 0, 0); }
    .x-yx774m { border-left-color: rgb(255, 0, 0); }
    .x-1h88r7n { border-top-left-radius: 4px; }
    .x-1bdvcgl { border-top-right-radius: 4px; }
    .x-misotl { border-bottom-right-radius: 4px; }
    .x-qirwg6 { border-bottom-left-radius: 4px; }
    .x-1ppxwh4 { border-top-style: dotted; }
    .x-1o74rcf { border-right-style: dotted; }
    .x-1vqxhxy { border-bottom-style: dotted; }
    .x-9xwnqj { border-left-style: dotted; }
    .x-29ghif { border-top-width: 2px; }
    .x-1h9xl6o { border-right-width: 2px; }
    .x-s861vp { border-bottom-width: 2px; }
    .x-1a0ix0g { border-left-width: 2px; }
    .x-fh1clx { flex-grow: 1; }
    .x-1t1j3t { flex-shrink: 1; }
    .x-tklrwr { flex-basis: 0%; }
    .x-o0zst5 { top: 10px; }
    .x-zs882z { right: 10px; }
    .x-4esd6u { bottom: 10px; }
    .x-jwnrsh { left: 10px; }
    .x-8wdww5 { margin-top: 10px; }
    .x-1f13l4q { margin-right: 10px; }
    .x-lx60ht { margin-bottom: 10px; }
    .x-cl7tym { margin-left: 10px; }
    .x-jm3jfd { padding-top: 10px; }
    .x-jlcvdv { padding-right: 10px; }
    .x-6rz8sj { padding-bottom: 10px; }
    .x-h002ba { padding-left: 10px; }"
  `);
});
