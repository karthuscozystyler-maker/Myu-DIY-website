// Builds the SHOPLINE runtime and the GitHub Pages folder (docs/).
// Run after `pnpm build:static` (or use `pnpm build:runtime`).
//
//   docs/myu-runtime.js   one classic script: CSS + React/Konva app
//   docs/products, docs/content   images the runtime loads at run time
//   docs/index.html       preview page that embeds the runtime like SHOPLINE does
//   deliverables/myu-shopline-cart-ready.html   short loader to paste into SHOPLINE
//   deliverables/myu-complete.html              offline backup (code inline, images hosted)
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import postcss from "postcss";

const root = process.cwd();
const PUBLIC_BASE = (
  process.env.MYU_PUBLIC_BASE ??
  "https://karthuscozystyler-maker.github.io/Myu-DIY-website/"
).replace(/\/?$/, "/");
const RUNTIME_FILE = "myu-runtime.js";
const site = path.join(root, "docs");
const deliverables = path.join(root, "deliverables");

const result = await build({
  absWorkingDir: root,
  entryPoints: ["client/src/export/embed-entry.tsx"],
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  minify: true,
  sourcemap: false,
  metafile: true,
  legalComments: "inline",
  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.env.BASE_URL": '"/"',
  },
  jsx: "automatic",
  plugins: [
    {
      name: "shopline-export-isolation",
      setup(builder) {
        builder.onLoad({ filter: /\.css$/ }, () => ({
          contents: "",
          loader: "js",
        }));
        builder.onLoad({ filter: /\.[jt]sx?$/ }, args => {
          if (!args.path.startsWith(path.join(root, "client", "src"))) return;
          let contents = fs.readFileSync(args.path, "utf8");
          // Focus is inside ShadowRoot, not document.activeElement (which is the host).
          const name = path.basename(args.path);
          if (["Start.tsx", "Home.tsx", "SeriesPage.tsx"].includes(name)) {
            contents = contents.replace(
              /import\s*\{\s*Link\s*\}\s*from\s*["']wouter["'];/g,
              'import { EmbedLink as Link } from "../export/EmbedLink";'
            );
          }
          if (
            [
              "FabricPicker.tsx",
              "PurchaseReview.tsx",
              "SeriesPage.tsx",
            ].includes(name)
          ) {
            const eventName = name === "SeriesPage.tsx" ? "e" : "event";
            contents = contents.replace(
              /(?:const\s+(?:previousOverflow|overflow)\s*=\s*document\.body\.style\.overflow\s*;|document\.body\.style\.overflow\s*=\s*(?:"hidden"|previousOverflow|overflow)\s*;)/g,
              ""
            );
            contents = contents.replaceAll(
              "document.activeElement",
              `(${eventName}.currentTarget.getRootNode().activeElement ?? document.activeElement)`
            );
          }
          return { contents, loader: args.path.endsWith("tsx") ? "tsx" : "ts" };
        });
      },
    },
  ],
});
if (result.outputFiles.length !== 1)
  throw new Error("Export must be one JavaScript bundle without chunks");
const javascript = result.outputFiles[0].text;
if (
  /manus-storage|manuscdn/i.test(javascript) ||
  /import\(["']\.\//.test(javascript)
)
  throw new Error("Export still contains Manus-hosted media or chunks");

const cssDirectory = path.join(root, "dist/public/assets");
const cssFile = fs
  .readdirSync(cssDirectory)
  .find(file => /^index-.*\.css$/.test(file));
if (!cssFile)
  throw new Error("Run pnpm build:static first to build the project CSS");
const styles = postcss.parse(
  fs.readFileSync(path.join(cssDirectory, cssFile), "utf8")
);
styles.walkRules(rule => {
  rule.selector = rule.selector
    .replace(/:root\b/g, ":host")
    .replace(/(^|[\s,])(?:html|body)(?=$|[\s,.#:[\]>+~])/g, "$1:host");
});
const css =
  ":host{display:block;position:relative;isolation:isolate;font-size:16px;line-height:1.5;text-align:left;color:#5b3926;background:#fff;min-width:0;}" +
  styles.toString();

const packages = new Set();
for (const input of Object.keys(result.metafile.inputs)) {
  const matches = [...input.matchAll(/node_modules\/(?:@[^/]+\/)?[^/]+/g)];
  const last = matches.at(-1);
  if (last)
    packages.add(path.join(root, input.slice(0, last.index + last[0].length)));
}
const licenses = [];
for (const directory of packages) {
  if (!fs.existsSync(directory)) continue;
  const license = fs
    .readdirSync(directory)
    .find(name => /^licen[sc]e(?:\.(?:md|txt))?$/i.test(name));
  if (license)
    licenses.push(
      `${path.basename(directory)}\n${fs.readFileSync(path.join(directory, license), "utf8")}`
    );
}

// The runtime finds its own [data-myu-embed] host, hands the CSS to the app
// (which moves it into a ShadowRoot) and loads images from its own folder.
const runtime =
  licenses.map(text => text.replace(/^/gm, "// ")).join("\n//\n") +
  "\n(function(){\n" +
  "var current=document.currentScript;\n" +
  "var host=(current&&current.closest('[data-myu-embed]'))||document.querySelector('[data-myu-embed]');\n" +
  "if(!host||host.shadowRoot)return;\n" +
  "if(!window.__MYU_ASSET_BASE__&&current&&current.src)window.__MYU_ASSET_BASE__=new URL('.',current.src).href;\n" +
  "var css=document.createElement('script');\n" +
  "css.type='text/myu-css';\n" +
  `css.textContent=${JSON.stringify(css)};\n` +
  "host.appendChild(css);\n" +
  javascript +
  "\n})();\n";

fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(site, { recursive: true });
fs.writeFileSync(path.join(site, RUNTIME_FILE), runtime);
fs.writeFileSync(path.join(site, ".nojekyll"), "");
// Only the web images: originals (content/source, *.png) stay in the repo.
for (const folder of ["products", "content"]) {
  const from = path.join(root, "client/public", folder);
  fs.mkdirSync(path.join(site, folder), { recursive: true });
  for (const file of fs.readdirSync(from)) {
    if (/\.(?:webp|jpg|svg)$/i.test(file))
      fs.copyFileSync(path.join(from, file), path.join(site, folder, file));
  }
}

const pageHead = `<!doctype html>
<html lang="zh-Hant-HK">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>沐幕引磁收納DIY</title>
<style>html,body{margin:0;padding:0;background:#fff;}body{font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",Arial,sans-serif;}</style>
</head>
<body>
`;
const loader = src =>
  `<div data-myu-embed>\n  <p style="padding:20px;color:#5b3926;">載入收納工具…</p>\n  <script src="${src}"></script>\n</div>\n`;
fs.writeFileSync(
  path.join(site, "index.html"),
  `${pageHead}${loader(RUNTIME_FILE)}</body>\n</html>\n`
);

const safe = text => text.replace(/<\/script/gi, "<\\/script");
fs.mkdirSync(deliverables, { recursive: true });
fs.writeFileSync(
  path.join(deliverables, "myu-shopline-cart-ready.html"),
  `<!-- 沐幕引磁收納DIY：貼入SHOPLINE自訂HTML，請取代舊碼。 -->\n${loader(PUBLIC_BASE + RUNTIME_FILE)}`
);
fs.writeFileSync(
  path.join(deliverables, "myu-complete.html"),
  `${pageHead}<!-- 完整備份：程式全部內嵌，圖片由 ${PUBLIC_BASE} 載入。SHOPLINE請使用 myu-shopline-cart-ready.html。 -->\n<script>window.__MYU_ASSET_BASE__=${JSON.stringify(PUBLIC_BASE)};</script>\n<div data-myu-embed>\n<script>${safe(runtime)}</script>\n<noscript>請啟用JavaScript以使用引磁收納DIY。</noscript>\n</div>\n</body>\n</html>\n`
);

console.log(
  `Runtime ${fs.statSync(path.join(site, RUNTIME_FILE)).size} bytes -> docs/${RUNTIME_FILE}; loader points to ${PUBLIC_BASE}${RUNTIME_FILE}`
);
