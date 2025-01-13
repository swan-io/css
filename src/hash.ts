import rawHash from "@emotion/hash";
import { memoizeOne } from "./utils";

export const hash = memoizeOne(rawHash);
