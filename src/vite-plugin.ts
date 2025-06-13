import MagicString from "magic-string";
import { createHash } from "node:crypto";
import { join } from "node:path";
import type { Node } from "oxc-parser";
import { parseAndWalk } from "oxc-walker";
import type { Plugin } from "vite";
import { createSheet } from "./sheet";

type PluginOptions = {
  fileName?: string;
};

const isCssMethodNode = (
  importName: string,
  methodName: "extend" | "make",
  node: Node,
) =>
  importName !== "" &&
  node.type === "MemberExpression" &&
  node.object.type === "Identifier" &&
  node.object.name === importName &&
  node.property.type === "Identifier" &&
  node.property.name === methodName;

const plugin = (options: PluginOptions = {}): Plugin => {
  const packageName = "@swan-io/css";
  const packageAliases = new Set([packageName]);

  let assetsDir = "assets";
  let emittedFileName = "";

  const sheet = createSheet();

  return {
    name: packageName,
    enforce: "post",

    configResolved({ build, resolve }) {
      assetsDir = build.assetsDir;
      const alias = resolve.alias.find((item) => item.find === packageName);

      if (alias != null) {
        packageAliases.add(alias.replacement);
      }
    },

    transform(code, id) {
      let cssImportName = "";
      const magicString = new MagicString(code);

      parseAndWalk(code, id, (node) => {
        if (
          node.type === "ImportDeclaration" &&
          packageAliases.has(node.source.value)
        ) {
          const specifier = node.specifiers.find(
            (specifier) =>
              specifier.type === "ImportSpecifier" &&
              specifier.imported.type === "Identifier" &&
              specifier.imported.name === "css",
          );

          if (specifier != null) {
            cssImportName = specifier.local.name;
          }
        } else if (
          node.type === "CallExpression" &&
          isCssMethodNode(cssImportName, "extend", node.callee)
        ) {
          const fn = node.arguments[0];

          if (fn != null && fn.type === "ObjectExpression") {
            const result = sheet.css.extend(
              new Function(`return ${magicString.slice(fn.start, fn.end)};`)(),
            );

            magicString.overwrite(
              node.start,
              node.end,
              JSON.stringify(result, null, 2),
            );
          } else {
            magicString.overwrite(node.start, node.end, "{}");
          }
        } else if (
          node.type === "CallExpression" &&
          isCssMethodNode(cssImportName, "make", node.callee)
        ) {
          const fn = node.arguments[0];

          if (fn != null && fn.type === "ObjectExpression") {
            const result = sheet.css.make(
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
            const result = sheet.css.make(
              new Function(
                "input",
                `return (${magicString.slice(fn.start, fn.end)})(input);`,
              )(sheet.input),
            );

            magicString.overwrite(
              node.start,
              node.end,
              JSON.stringify(result, null, 2),
            );
          } else {
            magicString.overwrite(node.start, node.end, "{}");
          }
        }
      });

      if (cssImportName !== "") {
        return {
          code: magicString.toString(),
          map: magicString.generateMap({ hires: true }),
        };
      }
    },

    generateBundle(_options, _bundle, _isWrite) {
      const source = sheet.toString();

      const hash = createHash("sha256")
        .update(source)
        .digest("hex")
        .slice(0, 8);

      const fileName = options.fileName ?? "styles";
      emittedFileName = join(assetsDir, `${fileName}-${hash}.css`);

      this.emitFile({
        type: "asset",
        source,
        fileName: emittedFileName,
      });
    },

    transformIndexHtml(html, _context) {
      if (emittedFileName !== "") {
        const attrs = {
          rel: "stylesheet",
          id: "swan-stylesheet",
          crossorigin: true,
          href: "/" + emittedFileName,
        };

        return {
          html,
          tags: [{ tag: "link", injectTo: "head", attrs }],
        };
      }
    },
  };
};

export default plugin;
