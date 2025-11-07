#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <repo-dir>" >&2
  exit 64
fi

repo="$1"
if [ ! -d "$repo" ]; then
  echo "Directory not found: $repo" >&2
  exit 66
fi

readme="$repo/README.md"
if [ ! -f "$readme" ]; then
  echo "No README.md found in $repo" >&2
  exit 66
fi

first_word=$(awk 'NR==1 {print $1}' "$readme")
if echo "$first_word" | grep -qi '^dmx'; then
  echo "DMX ready"
else
  echo "DMX not ready"
fi

word=$(awk 'NR==10 {print $5}' "$readme")
echo "$word"
