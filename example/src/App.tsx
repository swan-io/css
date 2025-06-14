import { css, cx } from "@swan-io/css";
import { useState } from "react";
import { useSheetLogger } from "./useSheetLogger";

const sheet = css((_theme, { keyframes }) => ({
  title: {
    color: "red",

    animationName: keyframes({
      from: { opacity: 0 },
      to: { opacity: 1 },
    }),

    ":hover": {
      color: "aquamarine",
    },
  },
  extra: {
    color: "blue",
  },
}));

export const App = () => {
  const [checked, setChecked] = useState(false);

  useSheetLogger(); // log sheet on "l" keypress

  return (
    <>
      <h1 className={cx(sheet.title, checked && sheet.extra)}>Hello world</h1>

      <span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked);
          }}
        />
        Add extra className
      </span>
    </>
  );
};
