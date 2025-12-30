#!/bin/bash
start_path="${ZED_FILE:-${ZED_WORKTREE_ROOT:-.}}"
selection_file=$(mktemp)

lf -selection-path="$selection_file" "$start_path"
[ -s "$selection_file" ] && cat "$selection_file" | tr '\n' '\0' | xargs -0 zed

rm "$selection_file"
