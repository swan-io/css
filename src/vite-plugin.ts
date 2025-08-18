import MagicString from "magic-string";
import HTMLParser from "node-html-parser";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { CallExpression, ImportDeclaration } from "oxc-parser";
import { ResolverFactory } from "oxc-resolver";
import { parseAndWalk } from "oxc-walker";
import type { Plugin, ResolvedConfig } from "vite";
import { getCssExtendInput } from "./css";

type PluginOptions = {
  fileName?: string;
};

const findSpecifier = (
  { specifiers }: ImportDeclaration,
  specifierName: "css" | "cx",
) =>
  specifiers.find(
    (specifier) =>
      specifier.type === "ImportSpecifier" &&
      specifier.imported.type === "Identifier" &&
      specifier.imported.name === specifierName,
  );

const isCssMethod = (
  { callee }: CallExpression,
  importName: string,
  methodName: "extend" | "make",
) =>
  importName !== "" &&
  callee.type === "MemberExpression" &&
  callee.object.type === "Identifier" &&
  callee.object.name === importName &&
  callee.property.type === "Identifier" &&
  callee.property.name === methodName;

const normalizeConfig = (config: ResolvedConfig) => {
  const { build, configFile: file, resolve } = config;
  const input = build.rollupOptions.input ?? "index.html"; // fallback to vite's default

  // https://vite.dev/config/shared-options.html#resolve-extensions
  const supportedExts = new Set([".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx"]);

  const root = path.isAbsolute(config.root)
    ? config.root
    : path.resolve(
        file != null ? path.dirname(file) : process.cwd(),
        config.root,
      );

  return {
    assetsDir: build.assetsDir,
    root,
    extensions: resolve.extensions.filter((ext) => supportedExts.has(ext)),

    alias: resolve.alias.reduce<Record<string, string[]>>(
      (acc, { find, replacement }) =>
        find === "string"
          ? { ...acc, [find]: [...(acc[find] ?? []), replacement] }
          : acc,
      {},
    ),

    inputs: (typeof input === "string"
      ? [input]
      : Array.isArray(input)
        ? input
        : Object.values(input)
    ).map((input) => path.resolve(root, input)),
  };
};

const plugin = async (options: PluginOptions = {}): Promise<Plugin> => {
  const { css, getCssMakeInput, getCssFileContent } = await import("./css");
  const { caches } = await import("./cx");

  const packageName = "@swan-io/css";
  const packageAliases = new Set([packageName]);

  let assetsDir = "assets";
  let cxVirtualModuleCode = "";
  let emittedFileName = "";

  const cxVirtualModuleId = "virtual:@swan-io/cx";
  const cxResolvedVirtualModuleId = "\0" + cxVirtualModuleId;

  return {
    name: packageName,

    configResolved: (resolvedConfig) => {
      const config = normalizeConfig(resolvedConfig);
      const { alias, extensions, inputs, root } = config;

      assetsDir = config.assetsDir;

      if (alias[packageName] != null) {
        alias[packageName].forEach((item) => packageAliases.add(item));
      }

      const resolve = new ResolverFactory({ alias, extensions });
      const resolvedFiles = new Set<string>();

      const visit = (file: string) => {
        if (resolvedFiles.has(file)) {
          return;
        }

        resolvedFiles.add(file);

        const code = fs.readFileSync(file, "utf-8");
        const dir = path.dirname(file);
        const ext = path.extname(file);

        if (ext === ".html" || ext === ".htm") {
          const html = HTMLParser.parse(code);

          const imports = [...html.querySelectorAll(`script[type="module"]`)]
            .map((item) => item.getAttribute("src"))
            .filter((src) => src != null)
            .filter((src) => extensions.includes(path.extname(src)))
            .map((src) =>
              path.resolve(
                root,
                path.isAbsolute(src) ? path.join(dir, src) : src,
              ),
            );

          // Depth-first: visit each import before continuing
          for (const item of imports) {
            visit(item);
          }
        } else if (extensions.includes(ext)) {
          const imports = new Set<string>();

          let cssImportName = "";

          parseAndWalk(code, file, (node) => {
            switch (node.type) {
              case "ExportNamedDeclaration": {
                if (
                  typeof node.source != null &&
                  typeof node.source?.value === "string"
                ) {
                  imports.add(node.source.value);
                }

                break;
              }

              case "ExportAllDeclaration": {
                imports.add(node.source.value);
                break;
              }

              case "ImportExpression": {
                if (
                  node.source.type === "Literal" &&
                  typeof node.source.value === "string"
                ) {
                  imports.add(node.source.value);
                }

                break;
              }

              case "ImportDeclaration": {
                imports.add(node.source.value);

                if (packageAliases.has(node.source.value)) {
                  const specifier = findSpecifier(node, "css");

                  if (specifier != null) {
                    cssImportName = specifier.local.name;
                  }
                }

                break;
              }

              case "CallExpression": {
                if (isCssMethod(node, cssImportName, "extend")) {
                  const arg = node.arguments[0];

                  if (arg?.type === "ObjectExpression") {
                    css.extend(
                      new Function(
                        `return ${code.slice(arg.start, arg.end)};`,
                      )(),
                    );
                  } else if (
                    arg?.type === "ArrowFunctionExpression" ||
                    arg?.type === "FunctionExpression"
                  ) {
                    css.extend(
                      new Function(
                        "input",
                        `return (${code.slice(arg.start, arg.end)})(input);`,
                      )(getCssExtendInput()),
                    );
                  }

                  break;
                }

                if (isCssMethod(node, cssImportName, "make")) {
                  const arg = node.arguments[0];

                  if (arg?.type === "ObjectExpression") {
                    css.make(
                      new Function(
                        `return ${code.slice(arg.start, arg.end)};`,
                      )(),
                    );
                  } else if (
                    arg?.type === "ArrowFunctionExpression" ||
                    arg?.type === "FunctionExpression"
                  ) {
                    css.make(
                      new Function(
                        "input",
                        `return (${code.slice(arg.start, arg.end)})(input);`,
                      )(getCssMakeInput()),
                    );
                  }
                }
              }
            }
          });

          for (const specifier of imports) {
            try {
              const resolved = resolve.sync(dir, specifier).path;

              if (resolved != null) {
                visit(resolved);
              }
            } catch {
              // ignore unresolved
            }
          }
        }
      };

      for (const input of inputs) {
        visit(input);
      }

      const cxId = path.join(__dirname, "./cx.mjs");
      const cxCode = fs.readFileSync(cxId, "utf-8");

      const magicString = new MagicString(cxCode);

      const toStringMap = (map: Map<string, string | undefined>): string =>
        `new Map([${[...map.entries()]
          .reduce<string[]>((acc, [key, value]) => {
            return value != null ? [...acc, `["${key}", "${value}"]`] : acc;
          }, [])
          .join(",")}])`;

      parseAndWalk(cxCode, cxId, (node) => {
        if (node.type === "VariableDeclaration") {
          const declaration = node.declarations[0];

          if (
            declaration != null &&
            declaration.id.type === "Identifier" &&
            declaration.id.name === "caches"
          ) {
            magicString.overwrite(
              node.start,
              node.end,
              `
var caches = {
  reset: new Set([${[...caches.reset].map((item) => `"${item}"`).join(",")}]),
  atomic: ${toStringMap(caches.atomic)},
  hover: ${toStringMap(caches.hover)},
  focus: ${toStringMap(caches.focus)},
  active:  ${toStringMap(caches.active)},
};
`.trim(),
            );
          }
        }
      });

      cxVirtualModuleCode = magicString.toString();
    },

    resolveId(id) {
      if (id === cxVirtualModuleId) {
        return cxResolvedVirtualModuleId;
      }
    },

    load(id) {
      if (id === cxResolvedVirtualModuleId) {
        return cxVirtualModuleCode;
      }
    },

    transform(code, id) {
      let cssImportName = "";
      let cxImportName = "";

      const magicString = new MagicString(code);

      parseAndWalk(code, id, (node) => {
        switch (node.type) {
          case "ImportDeclaration": {
            if (packageAliases.has(node.source.value)) {
              const cssLocalName = findSpecifier(node, "css")?.local.name;
              const cxLocalName = findSpecifier(node, "cx")?.local.name;

              if (cssLocalName != null) {
                cssImportName = cssLocalName;
                magicString.overwrite(node.start, node.end, "");
              }

              if (cxLocalName != null && cxLocalName !== "") {
                cxImportName = cxLocalName;

                magicString.overwrite(
                  node.start,
                  node.end,
                  `import { ${cxLocalName === "cx" ? "cx" : `cx as ${cxLocalName}`} } from "${cxVirtualModuleId}";`,
                );
              }
            }

            break;
          }

          case "CallExpression": {
            if (isCssMethod(node, cssImportName, "extend")) {
              const arg = node.arguments[0];

              if (arg?.type === "ObjectExpression") {
                const result = css.extend(
                  new Function(
                    `return ${magicString.slice(arg.start, arg.end)};`,
                  )(),
                );

                magicString.overwrite(
                  node.start,
                  node.end,
                  JSON.stringify(result, null, 2),
                );
              } else if (
                arg?.type === "ArrowFunctionExpression" ||
                arg?.type === "FunctionExpression"
              ) {
                const result = css.extend(
                  new Function(
                    "input",
                    `return (${magicString.slice(arg.start, arg.end)})(input);`,
                  )(getCssExtendInput()),
                );

                magicString.overwrite(
                  node.start,
                  node.end,
                  JSON.stringify(result, null, 2),
                );
              } else {
                magicString.overwrite(node.start, node.end, "{}");
              }

              break;
            }

            if (isCssMethod(node, cssImportName, "make")) {
              const arg = node.arguments[0];

              if (arg?.type === "ObjectExpression") {
                const result = css.make(
                  new Function(
                    `return ${magicString.slice(arg.start, arg.end)};`,
                  )(),
                );

                magicString.overwrite(
                  node.start,
                  node.end,
                  JSON.stringify(result, null, 2),
                );
              } else if (
                arg?.type === "ArrowFunctionExpression" ||
                arg?.type === "FunctionExpression"
              ) {
                const result = css.make(
                  new Function(
                    "input",
                    `return (${magicString.slice(arg.start, arg.end)})(input);`,
                  )(getCssMakeInput()),
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
          }
        }
      });

      if (cssImportName !== "" || cxImportName !== "") {
        return {
          code: magicString.toString(),
          map: magicString.generateMap({ hires: true }),
        };
      }
    },

    generateBundle() {
      const source = getCssFileContent();

      const hash = createHash("sha256")
        .update(source)
        .digest("hex")
        .slice(0, 8);

      const fileName = options.fileName ?? "styles";
      emittedFileName = path.join(assetsDir, `${fileName}-${hash}.css`);

      this.emitFile({
        type: "asset",
        source,
        fileName: emittedFileName,
      });
    },

    transformIndexHtml(html) {
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
