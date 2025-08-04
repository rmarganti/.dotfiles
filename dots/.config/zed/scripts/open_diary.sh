#!/bin/bash

# open_diary.sh
# Opens a diary file for the given date (default: today, or "yesterday" if passed as argument).
# If the file does not exist, creates it with YAML frontmatter and a heading.

# Usage:
#   ./open_diary.sh [today|yesterday]
#   If no argument is given, defaults to "today".

# Exit immediately if any command exits with a non-zero status.
set -e

# Load config from ~/.config/diary/config.json
CONFIG="$HOME/.config/diary/config.json"

WORKSPACE_PATH=$(eval echo "$(jq -r '.workspaces[0].path' "$CONFIG")")
DIARY_FOLDER=$(jq -r '.diary_folder' "$CONFIG")
DATE_FORMAT=$(jq -r '.date_format' "$CONFIG")
ALIAS_FORMAT=$(jq -r '.alias_format' "$CONFIG")

DIARY_DIR="$WORKSPACE_PATH/$DIARY_FOLDER"

# Determine date
if [[ "$1" == "yesterday" ]]; then
    DAY_OF_WEEK=$(date '+%u') # 1=Monday, ..., 7=Sunday
    if [[ "$DAY_OF_WEEK" == "7" ]]; then
        DATE_ID=$(date -v-2d +"$DATE_FORMAT")
        DATE_HUMAN=$(date -v-2d +"$ALIAS_FORMAT")
    elif [[ "$DAY_OF_WEEK" == "1" ]]; then
        DATE_ID=$(date -v-3d +"$DATE_FORMAT")
        DATE_HUMAN=$(date -v-3d +"$ALIAS_FORMAT")
    else
        DATE_ID=$(date -v-1d +"$DATE_FORMAT")
        DATE_HUMAN=$(date -v-1d +"$ALIAS_FORMAT")
    fi
else
    DATE_ID=$(date +"$DATE_FORMAT")
    DATE_HUMAN=$(date +"$ALIAS_FORMAT")
fi

FILE="$DIARY_DIR/$DATE_ID.md"

# If file does not exist, create it with template
if [[ ! -f "$FILE" ]]; then
    mkdir -p "$DIARY_DIR"
    cat >"$FILE" <<EOF
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
