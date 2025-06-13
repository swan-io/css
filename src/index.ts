import {
  preprocessAtomicStyle,
  preprocessKeyframes,
  preprocessResetStyle,
} from "./preprocess";
import { createSheet } from "./sheet";
import type { Keyframes, Nestable, Style } from "./types";
import { forEach } from "./utils";

const sheet = createSheet();

const utils = {
  keyframes: (keyframes: Keyframes): string | undefined =>
    sheet.insertKeyframes(preprocessKeyframes(keyframes)),
};

type Utils = typeof utils;

export const css = <K extends string>(
  styles:
    | Record<K, Nestable<Style>>
    | ((
        theme: Record<string, string>,
        utils: Utils,
      ) => Record<K, Nestable<Style>>),
): Record<K, string> => {
  const output = {} as Record<K, string>;

  forEach(
    typeof styles === "function" ? styles({}, utils) : styles,
    (key, value) => {
      output[key] =
        key[0] === "$"
          ? sheet.insertResetRule(preprocessResetStyle(value))
          : sheet.insertAtomicRules(preprocessAtomicStyle(value));
    },
  );

  return output;
};

export const cx = sheet.cx;
