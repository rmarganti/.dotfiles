#!/bin/bash
start_dir="${ZED_FILE%/*}"
start_dir="${start_dir:-${ZED_WORKTREE_ROOT:-.}}"
selection_file=$(mktemp)

lf -selection-path="$selection_file" "$start_dir"
[ -s "$selection_file" ] && zed "$(cat "$selection_file")"

rm "$selection_file"
