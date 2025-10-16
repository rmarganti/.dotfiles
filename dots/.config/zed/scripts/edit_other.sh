#!/usr/bin/env bash

# edit_other.sh
# Opens the "other" (related) file for the current file, based on configurable patterns.
# Usage: Run as a Zed task. Relies on $ZED_FILE and $ZED_WORKTREE_ROOT environment variables.
# Config: Expects other-files.json (or other-files.jsonc) in the same directory as this script.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/other-files.jsonc"

# Function to strip JSONC comments (supports // and /* */ comments)
strip_jsonc_comments() {
    # Remove single-line comments (//), multi-line comments (/* */), and trailing commas
    perl -0777 -pe '
    s|//.*?\n|\n|g;                       # Remove // comments
    s|/\*.*?\*/||gs;                      # Remove /* */ comments
    s|,(\s*[}\]])|\1|g;                   # Remove trailing commas before } or ]
  '
}

CURRENT_FILE="${ZED_FILE:-}"
WORKTREE_ROOT="${ZED_WORKTREE_ROOT:-}"

if [[ -z "$CURRENT_FILE" || -z "$WORKTREE_ROOT" ]]; then
    echo "Error: ZED_FILE or ZED_WORKTREE_ROOT not set." >&2
    exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "Error: Config file not found: $CONFIG_FILE" >&2
    exit 1
fi

# Get the filename relative to the worktree root
REL_PATH="${CURRENT_FILE#$WORKTREE_ROOT/}"

# jq is required for JSON parsing
if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq is required but not installed." >&2
    exit 1
fi

# Always initialize matches array for Bash 3 compatibility
matches=()

# Try all patterns in order, collect all matches
mappings=()
while IFS= read -r mapping; do
    mappings[${#mappings[@]}]="$mapping"
done < <(strip_jsonc_comments <"$CONFIG_FILE" | jq -c '.[]')
for mapping in "${mappings[@]}"; do
    pattern=$(jq -r '.pattern' <<<"$mapping")
    target=$(jq -r '.target' <<<"$mapping")

    # Use perl for regex matching and replacement
    # Compile pattern from string to handle special characters safely
    if perl -e '
      my $file = $ARGV[0];
      my $pattern = $ARGV[1];
      my $re = eval { qr/$pattern/ };
      exit 1 if $@;
      exit !($file =~ $re);
    ' "$REL_PATH" "$pattern"; then
        # Compute the target path
        target_path=$(perl -e '
      my $file = $ARGV[0];
      my $pattern = $ARGV[1];
      my $target = $ARGV[2];
      my $re = eval { qr/$pattern/ };
      exit if $@;
      if ($file =~ $re) {
        my @caps = ($file =~ $re);
        my $out = $target;
        for (my $i = 0; $i < @caps; $i++) {
          my $idx = $i + 1;
          $out =~ s/\$$idx/$caps[$i]/g;
        }
        print $out;
      }
    ' "$REL_PATH" "$pattern" "$target")

        # Only consider non-empty results
        if [[ -n "$target_path" ]]; then
            # Always resolve relative to the same directory as the current file
            dir="$(dirname "$REL_PATH")"
            candidate="$dir/$(basename "$target_path")"
            # If the pattern already includes directories, use as is
            if [[ "$target_path" == /* ]]; then
                candidate="${target_path#/}"
            fi
            matches+=("$candidate")
        fi
    fi
done

# Remove duplicates (POSIX-safe, works on macOS Bash 3)
deduped=""
matches_deduped=()
for m in "${matches[@]:-}"; do
    case "$deduped" in
    *"|$m|"*) ;; # already in list
    *)
        matches_deduped+=("$m")
        deduped="$deduped|$m|"
        ;;
    esac
done
matches=("${matches_deduped[@]}")

# Prefer files that exist, but if none exist, use the first computed path
chosen=""
for m in "${matches[@]:-}"; do
    abs="$WORKTREE_ROOT/$m"
    if [[ -f "$abs" ]]; then
        chosen="$abs"
        break
    fi
done

if [[ -z "$chosen" && ${#matches[@]} -gt 0 ]]; then
    # None exist, but we have a candidate path
    chosen="$WORKTREE_ROOT/${matches[0]}"
fi

if [[ -z "$chosen" ]]; then
    echo "No related file mapping found for: $REL_PATH" >&2
    exit 2
fi

# Open the file in Zed (will create if it doesn't exist)
zed "$chosen"
