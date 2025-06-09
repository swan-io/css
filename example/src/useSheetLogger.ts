import { useEffect } from "react";

export const useSheetLogger = () => {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.code === "KeyL") {
        const sheet = document.querySelector<HTMLStyleElement>(
          `style[id="swan-stylesheet"]`,
        )?.sheet;

        if (sheet != null) {
          console.log(sheet);
        }
      }
    };

    document.addEventListener("keypress", listener);
    return () => document.removeEventListener("keypress", listener);
  }, []);
};
