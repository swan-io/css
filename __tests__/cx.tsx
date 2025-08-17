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

  expect(sheet.foo).toMatchInlineSnapshot(`"x-1ooaed4 x-9faglj"`);
  expect(sheet.bar).toMatchInlineSnapshot(`"x-a4kfub"`);

  expect(cx(sheet.foo, sheet.bar)).toMatchInlineSnapshot(
    `"x-1ooaed4 x-a4kfub"`,
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

  expect(sheet.$foo).toMatchInlineSnapshot(`"r-zyl1r2"`);
  expect(sheet.$bar).toMatchInlineSnapshot(`"r-a4kfub"`);
  expect(sheet.baz).toMatchInlineSnapshot(`"x-45si6m h-1w284cy"`);

  const className = cx(sheet.$foo, sheet.$bar, sheet.baz);
  expect(className).toMatchInlineSnapshot(`"r-zyl1r2 x-45si6m h-1w284cy"`);

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
