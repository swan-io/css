import { css } from "@swan-io/css";

const input = css.extend({
  colors: {
    red: "#fa2c37",
    blue: "#2c7fff",
    green: "#00c950",
  },
});

type CustomInput = typeof input;

declare module "@swan-io/css" {
  export interface Input extends CustomInput {}
}
