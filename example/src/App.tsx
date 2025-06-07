import { css } from "@swan-io/css";

const sheet = css.make({
  title: {
    color: "red",
  },
});

export const App = () => {
  return <h1 className={sheet.title}>Hello world</h1>;
};
