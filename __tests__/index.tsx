import * as React from "react";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { css } from "../src";
import { getElementStyle } from "./utils";

test("prints a red box", async () => {
  const sheet = css.make({
    box: {
      height: 100,
      width: 100,
      backgroundColor: "red",
    },
  });

  const screen = render(<div data-testid="box" className={sheet.box} />);
  const box = await screen.getByTestId("box");

  const style = getElementStyle(box.element());

  expect(style["height"]).toBe("100px");
  expect(style["width"]).toBe("100px");
  expect(style["background-color"]).toBe("rgb(255, 0, 0)");
});
