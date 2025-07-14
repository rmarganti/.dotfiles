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
    DAY_OF_WEEK=$(date '+%u') # 1=Monday, ..., 7=Sunday
    if [[ "$DAY_OF_WEEK" == "7" ]]; then
        # Today is Sunday, so "yesterday" should be Friday (2 days ago)
        DATE_ID=$(date -v-2d '+%Y-%m-%d')
        DATE_HUMAN=$(date -v-2d '+%B %d, %Y')
    elif [[ "$DAY_OF_WEEK" == "1" ]]; then
        # Today is Monday, so "yesterday" should be Friday (3 days ago)
        DATE_ID=$(date -v-3d '+%Y-%m-%d')
        DATE_HUMAN=$(date -v-3d '+%B %d, %Y')
    else
        # All other days, "yesterday" is just the previous day
        DATE_ID=$(date -v-1d '+%Y-%m-%d')
        DATE_HUMAN=$(date -v-1d '+%B %d, %Y')
    fi
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
