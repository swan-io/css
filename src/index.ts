import {
  preprocessAtomicStyle,
  preprocessKeyframes,
  preprocessResetStyle,
} from "./preprocess";
import { createSheet } from "./sheet";
import type { Keyframes, Style } from "./types";
import { forEach } from "./utils";

const sheet = createSheet();

const keyframes = (keyframes: Keyframes): string | undefined =>
  sheet.insertKeyframes(preprocessKeyframes(keyframes));

const make = <K extends string>(
  styles: Record<K, Style>,
): Record<K, string> => {
  const output = {} as Record<K, string>;

  forEach(styles, (key, value) => {
    output[key] =
      key[0] === "$"
        ? sheet.insertResetRule(preprocessResetStyle(value))
        : sheet.insertAtomicRules(preprocessAtomicStyle(value));
  });

  return output;
};

export const css = { keyframes, make };
export const cx = sheet.cx;
