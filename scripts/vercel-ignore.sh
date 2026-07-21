#!/usr/bin/env bash

set -uo pipefail

target=${1:-}
base=${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}
head=${VERCEL_GIT_COMMIT_SHA:-HEAD}

if ! git rev-parse --verify "${base}^{commit}" >/dev/null 2>&1; then
  echo "找不到上一次部署提交，继续部署。"
  exit 1
fi

if ! git rev-parse --verify "${head}^{commit}" >/dev/null 2>&1; then
  echo "找不到当前部署提交，继续部署。"
  exit 1
fi

case "$target" in
  website)
    filter="website..."
    inputs=(
      apps/website/src
      apps/website/public
      apps/website/index.html
      apps/website/package.json
      apps/website/tsconfig.json
      apps/website/uno.config.ts
      apps/website/vite.config.ts
      packages/api/src
      packages/api/package.json
      packages/api/tsconfig.json
      packages/api/vite.config.ts
      packages/ubb/src
      packages/ubb/package.json
      packages/ubb/tsconfig.json
      packages/ubb/vite.config.ts
      package.json
      scripts/vercel-ignore.sh
      vercel.json
      vite.config.ts
    )
    ;;
  docs)
    filter="docs..."
    inputs=(
      apps/docs/.vitepress
      apps/docs/content
      apps/docs/public
      apps/docs/package.json
      apps/docs/vercel.json
      package.json
      scripts/vercel-ignore.sh
      vite.config.ts
    )
    ;;
  *)
    echo "未知 Vercel 项目：$target"
    exit 1
    ;;
esac

if ! git diff --quiet "$base" "$head" -- "${inputs[@]}"; then
  echo "$target 的构建输入发生变化，继续部署。"
  exit 1
fi

if git diff --quiet "$base" "$head" -- pnpm-lock.yaml pnpm-workspace.yaml; then
  echo "$target 的构建输入没有变化，跳过部署。"
  exit 0
fi

temp_dir=$(mktemp -d)
trap 'rm -rf -- "$temp_dir"' EXIT

dependency_hash() {
  local ref=$1
  local checkout_dir="$temp_dir/checkout"

  rm -rf -- "$checkout_dir"
  mkdir -p "$checkout_dir"
  git archive "$ref" | tar -x -C "$checkout_dir" || return 1

  (
    cd "$checkout_dir" || return 1
    corepack pnpm list --filter "$filter" --depth Infinity --lockfile-only --json
  ) | sed "s|$checkout_dir|<workspace>|g" | git hash-object --stdin
}

if ! previous_hash=$(dependency_hash "$base"); then
  echo "无法读取上一次部署的依赖图，继续部署。"
  exit 1
fi

if ! current_hash=$(dependency_hash "$head"); then
  echo "无法读取当前提交的依赖图，继续部署。"
  exit 1
fi

if [[ "$previous_hash" == "$current_hash" ]]; then
  echo "$target 的依赖图没有变化，跳过部署。"
  exit 0
fi

echo "$target 的依赖图发生变化，继续部署。"
exit 1
