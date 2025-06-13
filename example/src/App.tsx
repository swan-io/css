import { css, cx } from "@swan-io/css";
import { useState } from "react";
import { useSheetLogger } from "./useSheetLogger";

const sheet = css.make(({ colors }) => ({
  title: {
    color: colors.red,
    ":hover": {
      color: colors.blue,
    },
  },
  extra: {
    color: colors.green,
  },
}));

export const App = () => {
  const [checked, setChecked] = useState(false);

  useSheetLogger(); // log sheet on "l" keypress

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
  };

  return (
    <>
      <h1 className={cx(sheet.title, checked && sheet.extra)}>Hello world</h1>

      <span>
        <input checked={checked} type="checkbox" onChange={handleOnChange} />
        Add extra className
      </span>
    </>
  );
};
