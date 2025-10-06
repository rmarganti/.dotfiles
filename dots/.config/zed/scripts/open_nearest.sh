#!/bin/bash

# open_nearest.sh
# Opens the nearest target file (default: CHANGELOG.md) upwards from the current file's directory.
# Usage:
#   ./open_nearest.sh [target_filename]
#   Environment variables used:
#     $ZED_FILE - path to the current file
#     $ZED_WORKTREE_ROOT - root of the current workspace

set -e

TARGET_FILE="${1:-CHANGELOG.md}"

# Use Zed's environment variables
CURRENT_FILE="${ZED_FILE:-}"
WORKTREE_ROOT="${ZED_WORKTREE_ROOT:-}"

if [[ -z "$WORKTREE_ROOT" ]]; then
    exit 1
fi

if [[ -z "$CURRENT_FILE" ]]; then
    # No current file context; only operate in the worktree root
    zed "$WORKTREE_ROOT/$TARGET_FILE"
    exit 0
fi

SEARCH_DIR="$(dirname "$CURRENT_FILE")"
FOUND_FILE=""

while true; do
    CANDIDATE="$SEARCH_DIR/$TARGET_FILE"
    if [[ -f "$CANDIDATE" ]]; then
        FOUND_FILE="$CANDIDATE"
        break
    fi

    # If we've reached the worktree root, stop searching
    if [[ "$SEARCH_DIR" == "$WORKTREE_ROOT" ]]; then
        break
    fi

    # Move up one directory
    PARENT_DIR="$(dirname "$SEARCH_DIR")"
    if [[ "$PARENT_DIR" == "$SEARCH_DIR" ]]; then
        # Reached filesystem root
        break
    fi
    SEARCH_DIR="$PARENT_DIR"
done

# Fallback: use worktree root if not found
if [[ -z "$FOUND_FILE" ]]; then
    FOUND_FILE="$WORKTREE_ROOT/$TARGET_FILE"
fi

# Open the file in Zed
zed "$FOUND_FILE"
