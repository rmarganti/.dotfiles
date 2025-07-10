#!/bin/bash

# open_diary.sh
# Opens a diary file for the given date (default: today, or "yesterday" if passed as argument).
# If the file does not exist, creates it with YAML frontmatter and a heading.

# Usage:
#   ./open_diary.sh [today|yesterday]
#   If no argument is given, defaults to "today".

set -e

# Configurable diary directory
DIARY_DIR="$HOME/Library/CloudStorage/OneDrive-GannettCompany,Incorporated/obsidian/work/diary"

# Determine date
if [[ "$1" == "yesterday" ]]; then
    DATE_ID=$(date -v-1d '+%Y-%m-%d')
    DATE_HUMAN=$(date -v-1d '+%B %d, %Y')
else
    DATE_ID=$(date '+%Y-%m-%d')
    DATE_HUMAN=$(date '+%B %d, %Y')
fi

FILE="$DIARY_DIR/$DATE_ID.md"

# If file does not exist, create it with template
if [[ ! -f "$FILE" ]]; then
    mkdir -p "$DIARY_DIR"
    cat > "$FILE" <<EOF
---
id: "$DATE_ID"
aliases:
  - $DATE_HUMAN
tags:
  - daily-notes
---

# $DATE_HUMAN

EOF
fi

# Open the file in Zed
zed "$FILE"
