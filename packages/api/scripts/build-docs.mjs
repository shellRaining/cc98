import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const generatedDir = resolve(packageDir, "generated");
const checkOnly = process.argv.includes("--check");
const outputDirArgument = process.argv
  .find((argument) => argument.startsWith("--output-dir="))
  ?.slice("--output-dir=".length);
const temporaryDir = checkOnly ? await mkdtemp(resolve(tmpdir(), "cc98-api-docs-")) : null;
const outputDir = temporaryDir
  ? temporaryDir
  : outputDirArgument
    ? resolve(packageDir, outputDirArgument)
    : resolve(packageDir, "docs/dist");
const reviewDate = "2026-07-25";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function page(title, body) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
      body { max-width: 1180px; margin: 0 auto; padding: 32px 24px 64px; line-height: 1.6; }
      a { color: #0b5394; } @media (prefers-color-scheme: dark) { a { color: #7db7ef; } }
      nav { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 32px; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th, td { border: 1px solid #d7dce2; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: color-mix(in srgb, CanvasText 7%, Canvas); position: sticky; top: 0; }
      code { font-family: ui-monospace, monospace; overflow-wrap: anywhere; }
      .method { font-weight: 700; } .meta { color: color-mix(in srgb, CanvasText 65%, Canvas); }
    </style>
  </head>
  <body>${body}</body>
</html>
`;
}

function navigation() {
  return `<nav>
  <a href="./index.html">首页</a>
  <a href="./catalog.html">接口目录</a>
  <a href="./openapi.html">主 API 参考</a>
  <a href="./openid.html">OpenID 参考</a>
</nav>`;
}

function redocPage(title, specification) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <div id="redoc"></div>
    <noscript><p>请启用 JavaScript，或直接查看 <a href="${specification}">OpenAPI JSON</a>。</p></noscript>
    <script src="https://cdn.redocly.com/redoc/v2.5.3/bundles/redoc.standalone.js" integrity="sha384-xiEssMQFSpSfLbzRZCGfxxIM5QDb2DTrU6vyoZdp2sV1L6pmOMy6MpTtUoLbpC96" crossorigin="anonymous"></script>
    <script>Redoc.init(${JSON.stringify(specification)}, { disableGoogleFont: true }, document.getElementById("redoc"));</script>
  </body>
</html>
`;
}

try {
  const [openapi, openid, catalog] = await Promise.all([
    readFile(resolve(generatedDir, "openapi.json"), "utf8").then(JSON.parse),
    readFile(resolve(generatedDir, "openid.openapi.json"), "utf8").then(JSON.parse),
    readFile(resolve(generatedDir, "endpoint-catalog.json"), "utf8").then(JSON.parse),
  ]);
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  await Promise.all([
    writeFile(resolve(outputDir, "openapi.html"), redocPage("CC98 API 参考", "./openapi.json")),
    writeFile(
      resolve(outputDir, "openid.html"),
      redocPage("CC98 OpenID 参考", "./openid.openapi.json"),
    ),
    ...["openapi.json", "openid.openapi.json", "endpoint-catalog.json"].map((fileName) =>
      copyFile(resolve(generatedDir, fileName), resolve(outputDir, fileName)),
    ),
  ]);

  const rows = catalog
    .map(
      (operation) => `<tr>
  <td class="method">${escapeHtml(operation.method)}</td>
  <td><code>${escapeHtml(operation.path)}</code></td>
  <td><code>${escapeHtml(operation.operationId)}</code><br />${escapeHtml(operation.summary)}</td>
  <td>${operation.requiresAuthentication ? "Bearer" : "匿名"}</td>
  <td>${escapeHtml(operation.risk)}</td>
  <td>${escapeHtml(operation.verificationStatus)}</td>
</tr>`,
    )
    .join("\n");
  const catalogPage = page(
    "CC98 API 接口目录",
    `${navigation()}
<h1>接口目录</h1>
<p class="meta">状态基线更新于 ${reviewDate}，共 ${catalog.length} 个 operation。</p>
<table>
  <thead><tr><th>方法</th><th>路径</th><th>接口</th><th>认证</th><th>风险</th><th>验证状态</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`,
  );
  const indexPage = page(
    "CC98 API 文档",
    `${navigation()}
<h1>CC98 API 文档</h1>
<p>文档由仓库中的 Zod schema 和 operation registry 生成。OpenAPI 文件和静态页面都是可重建投影，契约修改应回到源码。</p>
<ul>
  <li>主 API：${Object.keys(openapi.paths ?? {}).length} 个 path</li>
  <li>OpenID：${Object.keys(openid.paths ?? {}).length} 个 path</li>
  <li>接口目录：${catalog.length} 个 operation</li>
</ul>
<h2>下载</h2>
<ul>
  <li><a href="./openapi.json">主 API OpenAPI JSON</a></li>
  <li><a href="./openid.openapi.json">OpenID OpenAPI JSON</a></li>
  <li><a href="./endpoint-catalog.json">接口目录 JSON</a></li>
</ul>
<h2>接入 Apifox</h2>
<p>主 API 与 OpenID 使用不同的服务地址和认证语义，应分别绑定为两个 URL 数据源：</p>
<ul>
  <li><a href="./openapi.json">主 API 数据源</a></li>
  <li><a href="./openid.openapi.json">OpenID 数据源</a></li>
</ul>`,
  );
  await Promise.all([
    writeFile(resolve(outputDir, "index.html"), indexPage),
    writeFile(resolve(outputDir, "catalog.html"), catalogPage),
  ]);

  const [indexHtml, catalogHtml, mainHtml, openIdHtml] = await Promise.all(
    ["index.html", "catalog.html", "openapi.html", "openid.html"].map((fileName) =>
      readFile(resolve(outputDir, fileName), "utf8"),
    ),
  );
  if (!indexHtml.includes("CC98 API 文档")) throw new Error("文档首页生成失败");
  if (!catalogHtml.includes("getBoardBoardId")) throw new Error("接口目录缺少已知 operation");
  if (!openapi.paths?.["/board/{boardId}"]) throw new Error("主 API 规范缺少已知 operation");
  if (!openid.paths?.["/connect/token"]) throw new Error("OpenID 规范缺少 token operation");
  if (!mainHtml.includes("./openapi.json")) throw new Error("主 API 参考文档未绑定 JSON 规范");
  if (!openIdHtml.includes("./openid.openapi.json"))
    throw new Error("OpenID 参考文档未绑定 JSON 规范");

  console.log(`生成 API 静态文档：${outputDir}`);
} finally {
  if (temporaryDir) await rm(temporaryDir, { recursive: true, force: true });
}
