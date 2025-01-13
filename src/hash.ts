import rawHash from "@emotion/hash";
import { memoize } from "./utils";

export const hash = memoize(rawHash);
