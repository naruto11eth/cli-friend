#!/usr/bin/env bash
# Compile the on-device speech-to-text helper and place it where Tauri's
# `externalBin` expects it (binaries/vim-helper-stt-<target-triple>).
set -euo pipefail

cd "$(dirname "$0")/.."

# Target triple Tauri expects for the sidecar filename.
TRIPLE="$(rustc -vV | sed -n 's/host: //p')"
OUT="src-tauri/binaries/cli-friend-stt-${TRIPLE}"
mkdir -p src-tauri/binaries

echo "Compiling stt/vh-stt.swift -> ${OUT}"
swiftc -O stt/vh-stt.swift -o "${OUT}" \
  -framework Speech -framework AVFoundation \
  -Xlinker -sectcreate -Xlinker __TEXT -Xlinker __info_plist -Xlinker stt/Info.plist

# Ad-hoc code-sign so macOS TCC will prompt for / remember mic permission.
codesign --force --sign - "${OUT}"

echo "Built and signed ${OUT}"
