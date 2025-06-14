import MagicString from "magic-string";
import { createHash } from "node:crypto";
import { parseAndWalk } from "oxc-walker";
import type { Plugin } from "vite";
import { createSheet } from "../../src/sheet";

export const plugin = (): Plugin => {
  const packageName = "@swan-io/css";
  const sheet = createSheet();

  let fileName = "";

  return {
    name: packageName,

    transform(code, id) {
      const magicString = new MagicString(code);

      let importName = "";

      parseAndWalk(code, id, (node) => {
        if (
          node.type === "ImportDeclaration" &&
          node.source.value === packageName // TODO: add an option or read the alias
        ) {
          const specifier = node.specifiers.find(
            (specifier) =>
              specifier.type === "ImportSpecifier" &&
              specifier.imported.type === "Identifier" &&
              specifier.imported.name === "css",
          );

          if (specifier != null) {
            importName = specifier.local.name;
          }
        }

        if (
          importName !== "" &&
          node.type === "CallExpression" &&
          node.callee.type === "Identifier" &&
          node.callee.name === importName
        ) {
          const fn = node.arguments.at(0);

          if (fn != null && fn.type === "ObjectExpression") {
            const result = sheet.css(
              new Function(`return ${magicString.slice(fn.start, fn.end)};`)(),
            );

            magicString.overwrite(
              node.start,
              node.end,
              JSON.stringify(result, null, 2),
            );
          } else if (
            fn != null &&
            (fn.type === "ArrowFunctionExpression" ||
              fn.type === "FunctionExpression")
          ) {
            // TODO: pass theme
            const theme = {};

            const result = sheet.css(
              new Function(
                "theme",
                "utils",
                `return (${magicString.slice(fn.start, fn.end)})(theme, utils);`,
              )(theme, sheet.utils),
            );

            magicString.overwrite(
              node.start,
              node.end,
              JSON.stringify(result, null, 2),
            );
          } else {
            // TODO: throw error
          }
        }
      });

      if (importName !== "") {
        return {
          code: magicString.toString(),
          map: magicString.generateMap({ hires: true }), // TODO: add an option for not outputting sourcemap
        };
      }
    },

    generateBundle(_options, _bundle, _isWrite) {
      const source = sheet.toString();

      const hash = createHash("sha256")
        .update(source)
        .digest("hex")
        .slice(0, 8); // 8-char hash

      fileName = `assets/styles-${hash}.css`;

      this.emitFile({
        type: "asset",
        source,
        fileName, // TODO: custom assets directory
      });
    },

    transformIndexHtml(html, _context) {
      if (fileName !== "") {
        return {
          html,
          tags: [
            {
              tag: "link",
              injectTo: "head",
              attrs: {
                rel: "stylesheet",
                id: "swan-stylesheet",
                crossorigin: true,
                href: "/" + fileName,
              },
            },
          ],
        };
      }
    },
  };
};
