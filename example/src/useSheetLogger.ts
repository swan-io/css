import { useEffect } from "react";

export const useSheetLogger = () => {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.code === "KeyL") {
        const sheet = document.querySelector<HTMLStyleElement>(
          `style[id="swan-stylesheet"]`,
        )?.sheet;

        if (sheet != null) {
          console.log(
            [...sheet.cssRules]
              .filter((rule) => rule instanceof CSSMediaRule)
              .map((rule) => ({
                conditionText: rule.conditionText,

                cssRules: [...rule.cssRules].map((rule) => {
                  if (rule instanceof CSSKeyframesRule) {
                    return {
                      cssText: [...rule].map((keyframe) => keyframe.cssText),
                      name: rule.name,
                    };
                  }
                  if (rule instanceof CSSStyleRule) {
                    return {
                      cssText: rule.cssText,
                      selectorText: rule.selectorText,
                    };
                  }

                  return rule;
                }),
              })),
          );
        }
      }
    };

    document.addEventListener("keypress", listener);

    return () => {
      document.removeEventListener("keypress", listener);
    };
  }, []);
};
