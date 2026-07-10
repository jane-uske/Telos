#!/usr/bin/env bash
# 一键更新 Telos（在服务器上跑）：拉代码 → 装依赖 → 构建 → 重启服务
# 用法：bash <REPO>/deploy/update.sh
set -euo pipefail

REPO="${REPO:-/opt/telos}"
cd "$REPO"

echo "==> 1/4 拉取最新代码"
git pull --ff-only

echo "==> 2/4 安装依赖（含 Chromium，走 npmmirror）"
PUPPETEER_DOWNLOAD_BASE_URL=https://cdn.npmmirror.com/binaries/chrome-for-testing \
  npm ci --registry=https://registry.npmmirror.com

echo "==> 3/4 构建"
# 服务器直连不了 Google Fonts 时，取消注释走代理（Turbopack 只认大写变量）：
# export HTTPS_PROXY=http://127.0.0.1:7890 HTTP_PROXY=http://127.0.0.1:7890 NO_PROXY=localhost,127.0.0.1
npm run build

echo "==> 4/4 重启服务"
sudo systemctl restart telos
sudo systemctl --no-pager --lines=5 status telos
echo "✅ 更新完成"
