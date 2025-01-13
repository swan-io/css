import hashRaw from "@emotion/hash";
import { memoizeOne } from "./utils";

export const hash = memoizeOne(hashRaw);
