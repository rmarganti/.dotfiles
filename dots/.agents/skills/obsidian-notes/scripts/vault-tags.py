#!/usr/bin/env python3
"""
Extract and count all tags from Obsidian vault frontmatter.
Handles both inline (tags: [a, b]) and list (tags:\n  - a) YAML formats.

Usage: python3 vault-tags.py <vault-path>
"""
import sys
import glob
import re
from collections import Counter

if len(sys.argv) < 2:
    print("Usage: vault-tags.py <vault-path>", file=sys.stderr)
    sys.exit(1)

vault = sys.argv[1]
tags = Counter()

for path in glob.glob(vault + "/**/*.md", recursive=True):
    try:
        text = open(path).read()
    except Exception:
        continue

    m = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not m:
        continue
    fm = m.group(1)

    # Inline format: tags: [foo, bar]
    inline = re.search(r"^tags:\s*\[(.+)\]", fm, re.MULTILINE)
    if inline:
        for t in inline.group(1).split(","):
            t = t.strip().strip("\"'")
            if t:
                tags[t] += 1
    else:
        # List format:
        # tags:
        #   - foo
        in_tags = False
        for line in fm.splitlines():
            if re.match(r"^tags:\s*$", line):
                in_tags = True
            elif in_tags and re.match(r"^\s+-\s+", line):
                tags[re.sub(r"^\s+-\s+", "", line).strip()] += 1
            elif in_tags:
                in_tags = False

for tag, count in tags.most_common():
    print(f"{count:4d}  {tag}")
