#!/usr/bin/env bash
# 灰风 · 纳米档案 — local installer for DSH Web.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TGZ="${1:-$ROOT/dsh-gray-theme-0.1.0.tgz}"
PROFILE="${DSH_PROFILE:-web}"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
export DSH_HOME
PROFILE_DIR="$DSH_HOME/profiles/$PROFILE"
MANIFEST="$PROFILE_DIR/package.json"

say() { printf '\n\033[38;5;80m%s\033[0m\n' "$*"; }
die() { printf '\n\033[38;5;203m%s\033[0m\n' "$*" >&2; exit 1; }

say "灰风主题安装器"
printf 'package : %s\nprofile : %s\nhome    : %s\n' "$TGZ" "$PROFILE" "$DSH_HOME"

[ -f "$TGZ" ] || die "找不到安装包：$TGZ（先在项目根目录执行打包，或传入 .tgz 路径）"
[ -f "$MANIFEST" ] || die "找不到 profile 清单：$MANIFEST（确认 DSH_HOME / profile 名称）"
[ -w "$PROFILE_DIR" ] || die "profile 目录不可写：$PROFILE_DIR
如果根文件系统是只读的，请先恢复写权限；或把整个 profile 放到可写目录，再用 DSH_HOME 指向它。"
[ -w "$MANIFEST" ] || die "profile 清单不可写：$MANIFEST"

NODE_BIN="${NODE_BIN:-node}"
if ! "$NODE_BIN" -v >/dev/null 2>&1; then
  if [ -x /snap/node/current/bin/node ]; then
    NODE_BIN=/snap/node/current/bin/node
  else
    die "找不到可用的 Node.js（需要 >=20）"
  fi
fi

command -v dsh >/dev/null 2>&1 || die "找不到 dsh 命令；请确认 DSH 已加入 PATH"

cp "$MANIFEST" "$MANIFEST.bak-gray-theme"
say "1/2 安装依赖包"
dsh plugin --profile "$PROFILE" add "$TGZ"

say "2/2 写入 dsh.profile.bundles"
"$NODE_BIN" - "$MANIFEST" <<'NODE'
const fs = require('node:fs')
const file = process.argv[2]
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
pkg.dsh = pkg.dsh || {}
pkg.dsh.profile = pkg.dsh.profile || {}
const bundles = Array.isArray(pkg.dsh.profile.bundles) ? pkg.dsh.profile.bundles : []
if (!bundles.includes('dsh-gray-theme')) bundles.push('dsh-gray-theme')
pkg.dsh.profile.bundles = bundles
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
console.log('bundles:', bundles.join(', '))
NODE

say "完成。请重启 dsh web。"
printf '之后进入 设置 → 灰风主题；强制重播点“保存并重播启动”\n'
printf '原清单备份：%s\n' "$MANIFEST.bak-gray-theme"
