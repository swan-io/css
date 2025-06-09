import { css } from "@swan-io/css";
import { useSheetLogger } from "./useSheetLogger";

const sheet = css.make({
  title: {
    color: "red",
  },
});

export const App = () => {
  useSheetLogger(); // log sheet on "l" keypress
  return <h1 className={sheet.title}>Hello world</h1>;
};
