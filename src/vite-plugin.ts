import MagicString from "magic-string";
import HTMLParser from "node-html-parser";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { type Node } from "oxc-parser";
import { ResolverFactory } from "oxc-resolver";
import { parseAndWalk } from "oxc-walker";
import type { Plugin, ResolvedConfig } from "vite";

type PluginOptions = {
  fileName?: string;
};

const stringifySet = (value: Set<string>): string =>
  `new Set([${[...value].map((item) => `"${item}"`).join(",")}])`;

const stringifyMap = (value: Map<string, string | undefined>): string =>
  `new Map([${[...value.entries()]
    .filter((entry): entry is [string, string] => entry[1] != null)
    .map(([key, value]) => `["${key}", "${value}"]`)
    .join(",")}])`;

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

const getImportMap = ({
  alias,
  extensions,
  root,
  inputs,
}: ReturnType<typeof normalizeConfig>): Set<string> => {
  const resolve = new ResolverFactory({ alias, extensions });
  const seen = new Set<string>();

  const visit = (file: string) => {
    if (seen.has(file)) {
      return;
    }

    seen.add(file);

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
          path.resolve(root, path.isAbsolute(src) ? path.join(dir, src) : src),
        );

      // Depth-first: visit each import before continuing
      for (const item of imports) {
        visit(item);
      }
    } else if (extensions.includes(ext)) {
      const imports = new Set<string>();

      // TODO: avoid parsing + walking the file twice (save ASTs?)
      // TODO: replace with parseSync + walk
      parseAndWalk(code, file, (node) => {
        if (
          node.type === "ImportDeclaration" ||
          node.type === "ExportAllDeclaration"
        ) {
          return imports.add(node.source.value);
        }

        if (
          node.type === "ImportExpression" ||
          node.type === "ExportNamedDeclaration"
        ) {
          if (
            node.source?.type === "Literal" &&
            typeof node.source.value === "string"
          ) {
            return imports.add(node.source.value);
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

  return seen;
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
      const { alias } = config;

      assetsDir = config.assetsDir;

      if (alias[packageName] != null) {
        alias[packageName].forEach((item) => packageAliases.add(item));
      }

      const imports = getImportMap(config);

      for (const id of imports) {
        const code = fs.readFileSync(id, "utf-8");

        let cssImportName = "";

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
              css.extend(
                new Function(`return ${code.slice(fn.start, fn.end)};`)(),
              );
            }
          } else if (
            node.type === "CallExpression" &&
            isCssMethodNode(cssImportName, "make", node.callee)
          ) {
            const fn = node.arguments[0];

            if (fn != null && fn.type === "ObjectExpression") {
              css.make(
                new Function(`return ${code.slice(fn.start, fn.end)};`)(),
              );
            } else if (
              fn != null &&
              (fn.type === "ArrowFunctionExpression" ||
                fn.type === "FunctionExpression")
            ) {
              css.make(
                new Function(
                  "input",
                  `return (${code.slice(fn.start, fn.end)})(input);`,
                )(getCssMakeInput()),
              );
            }
          }
        });
      }

      const cxId = path.join(__dirname, "./cx.mjs");
      const cxCode = fs.readFileSync(cxId, "utf-8");
      const magicString = new MagicString(cxCode);

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
  reset: ${stringifySet(caches.reset)},
  atomic: ${stringifyMap(caches.atomic)},
  hover: ${stringifyMap(caches.hover)},
  focus: ${stringifyMap(caches.focus)},
  active:  ${stringifyMap(caches.active)},
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
      let isCxImported = false;

      const magicString = new MagicString(code);

      parseAndWalk(code, id, (node) => {
        if (
          node.type === "ImportDeclaration" &&
          packageAliases.has(node.source.value)
        ) {
          const cssLocalName = node.specifiers.find(
            (specifier) =>
              specifier.type === "ImportSpecifier" &&
              specifier.imported.type === "Identifier" &&
              specifier.imported.name === "css",
          )?.local.name;

          const cxLocalName = node.specifiers.find(
            (specifier) =>
              specifier.type === "ImportSpecifier" &&
              specifier.imported.type === "Identifier" &&
              specifier.imported.name === "cx",
          )?.local.name;

          if (cssLocalName != null) {
            cssImportName = cssLocalName;
            magicString.overwrite(node.start, node.end, "");
          }

          if (cxLocalName != null && !isCxImported) {
            isCxImported = true;

            magicString.overwrite(
              node.start,
              node.end,
              `import { ${cxLocalName === "cx" ? "cx" : `cx as ${cxLocalName}`} } from "${cxVirtualModuleId}";`,
            );
          }
        } else if (
          node.type === "CallExpression" &&
          isCssMethodNode(cssImportName, "extend", node.callee)
        ) {
          const fn = node.arguments[0];

          if (fn != null && fn.type === "ObjectExpression") {
            const result = css.extend(
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
            const result = css.make(
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
            const result = css.make(
              new Function(
                "input",
                `return (${magicString.slice(fn.start, fn.end)})(input);`,
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
      });

      if (cssImportName !== "" || isCxImported) {
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
