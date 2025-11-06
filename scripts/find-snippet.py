#!/usr/bin/env python3
import json, sys, glob, os
target = "Load a local repository"
for path in glob.glob(os.path.join("lepiter", "*.lepiter")):
    with open(path) as f:
        data = json.load(f)
    for snippet in data.get("children", {}).get("items", []):
        code = snippet.get("code")
        if isinstance(code, str) and target in code:
            print(path)
            sys.exit(0)
print("not found", file=sys.stderr)
