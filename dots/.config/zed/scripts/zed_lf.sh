#!/bin/bash
start_path="${ZED_FILE:-${ZED_WORKTREE_ROOT:-.}}"
selection_file=$(mktemp)

lf -selection-path="$selection_file" "$start_path"
[ -s "$selection_file" ] && zed "$(cat "$selection_file")"

rm "$selection_file"
