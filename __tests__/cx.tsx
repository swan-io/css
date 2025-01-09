import * as React from "react";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { css, cx } from "../src";

test("cx concatenates atomic classes", () => {
  const sheet = css.make({
    foo: {
      backgroundColor: "red",
      color: "blue",
    },
    bar: {
      color: "green",
    },
  });

  expect(sheet.foo).toMatchInlineSnapshot(`"x-7ogb2w x-rc30ek"`);
  expect(sheet.bar).toMatchInlineSnapshot(`"x-1w6oenc"`);

  expect(cx(sheet.foo, sheet.bar)).toMatchInlineSnapshot(
    `"x-7ogb2w x-1w6oenc"`,
  );
});

test("cx allows one reset style", async () => {
  const sheet = css.make({
    $foo: {
      backgroundColor: "red",
      color: "blue",
    },
    $bar: {
      color: "green",
    },
    baz: {
      color: "rebeccapurple",
      ":hover": {
        color: "gray",
      },
    },
  });

  expect(sheet.$foo).toMatchInlineSnapshot(`"r-1vjaegw"`);
  expect(sheet.$bar).toMatchInlineSnapshot(`"r-1w6oenc"`);
  expect(sheet.baz).toMatchInlineSnapshot(`"x-1ngrkn9 h-1g5wjl1"`);

  const className = cx(sheet.$foo, sheet.$bar, sheet.baz);
  expect(className).toMatchInlineSnapshot(`"r-1vjaegw x-1ngrkn9 h-1g5wjl1"`);

  const screen = render(<div data-testid="div" className={className} />);
  const div = await screen.getByTestId("div");
  const style = window.getComputedStyle(div.element());

  expect(style.backgroundColor).toBe("rgb(255, 0, 0)");
  expect(style.color).toBe("rgb(102, 51, 153)");
});

test("cx allows external classes", async () => {
  const sheet = css.make({
    foo: { lineClamp: 1 },
    bar: { lineClamp: 2 },
  });

  const className = cx(sheet.foo, false && sheet.bar, true && ["foo"]);
  expect(className).toMatchInlineSnapshot(`"foo x-1acs8jx"`);

  const screen = render(<input data-testid="div" className={className} />);
  const div = await screen.getByTestId("div");
  const style = window.getComputedStyle(div.element());

  expect(style.webkitLineClamp).toBe("1");
});
