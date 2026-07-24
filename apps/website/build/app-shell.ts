import type { Plugin, Rollup } from "vite";
import type { VitePluginPWAAPI } from "vite-plugin-pwa";

type PwaPlugin = Plugin & { api?: VitePluginPWAAPI };
type OutputBundle = Rollup.OutputBundle;
type OutputChunk = Rollup.OutputChunk;
type PrecacheEntry = string | { url: string; revision?: string | null };

const INDEX_SUFFIX = "/index.html";
const HOME_VIEW_SUFFIX = "/src/views/HomeView.vue";

function isChunk(output: OutputBundle[string]): output is OutputChunk {
  return output.type === "chunk";
}

function findChunk(
  bundle: OutputBundle,
  predicate: (chunk: OutputChunk) => boolean,
): OutputChunk | undefined {
  return Object.values(bundle).find((output): output is OutputChunk => {
    return isChunk(output) && predicate(output);
  });
}

function addChunkClosure(bundle: OutputBundle, root: OutputChunk, files: Set<string>): void {
  if (files.has(root.fileName)) return;

  files.add(root.fileName);
  for (const css of root.viteMetadata?.importedCss ?? []) files.add(css);

  for (const importedFile of root.imports) {
    const imported = bundle[importedFile];
    if (imported && isChunk(imported)) addChunkClosure(bundle, imported, files);
  }
}

export function collectAppShellEntries(bundle: OutputBundle): string[] {
  const entry = findChunk(
    bundle,
    (chunk) => chunk.isEntry && chunk.facadeModuleId?.endsWith(INDEX_SUFFIX) === true,
  );
  const home = findChunk(
    bundle,
    (chunk) => chunk.isDynamicEntry && chunk.facadeModuleId?.endsWith(HOME_VIEW_SUFFIX) === true,
  );

  if (!entry) throw new Error("没有在构建产物中找到网站入口 chunk");
  if (!home) throw new Error("没有在构建产物中找到首页路由 chunk");

  const files = new Set<string>();
  addChunkClosure(bundle, entry, files);
  addChunkClosure(bundle, home, files);

  for (const asset of home.viteMetadata?.importedAssets ?? []) files.add(asset);

  return [...files].sort();
}

export function appShellPlugin(pwaPlugins: Plugin[]): Plugin {
  const pwaPlugin = pwaPlugins.find((plugin) => plugin.name === "vite-plugin-pwa") as
    | PwaPlugin
    | undefined;
  if (!pwaPlugin?.api) throw new Error("vite-plugin-pwa 没有提供构建 API");

  return {
    name: "cc98:app-shell",
    apply: "build",
    generateBundle(_options, bundle) {
      const appShellEntries = collectAppShellEntries(bundle);
      pwaPlugin.api?.extendManifestEntries((entries: PrecacheEntry[]) => {
        const existing = new Set(
          entries.map((entry) => (typeof entry === "string" ? entry : entry.url)),
        );
        return [
          ...entries,
          ...appShellEntries
            .filter((url) => !existing.has(url))
            .map((url) => ({ url, revision: null })),
        ];
      });
    },
  };
}
