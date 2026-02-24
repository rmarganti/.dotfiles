#!/usr/bin/env bash
#
# quick-window.sh - Create tmux windows with predefined layouts
#
# Configuration file: ~/.config/tmux/quick-window.json
#
# Format:
# {
#   "/path/to/workdir": {
#     "layout-name": ["command for pane 1", "command for pane 2", ...],
#     "another-layout": ["cmd1", "cmd2", "cmd3"]
#   },
#   "/another/path": { ... }
# }
#
# - Keys are absolute directory paths (work directories)
# - Nested keys are layout names (window names)
# - Values are arrays of shell commands, one per pane (horizontal split)
# - Commands are executed in each pane sequentially

CONFIG_FILE="$HOME/.config/tmux/quick-window.json"

check_tmux() {
	if [[ -z "$TMUX" ]]; then
		echo "Error: Not running inside TMUX" >&2
		exit 1
	fi
}

check_config() {
	if [[ ! -f "$CONFIG_FILE" ]]; then
		exit 0
	fi
}

get_work_paths() {
	jq -r 'keys[]' "$CONFIG_FILE"
}

get_layouts_for_path() {
	local work_path="$1"
	jq -r ".\"$work_path\" | keys[]" "$CONFIG_FILE"
}

get_commands_for_layout() {
	local work_path="$1"
	local layout="$2"
	jq -r ".\"$work_path\"[\"$layout\"][]" "$CONFIG_FILE"
}

select_layout() {
	local work_path="$1"
	local layouts
	layouts=$(get_layouts_for_path "$work_path")
	local layout_count
	layout_count=$(echo "$layouts" | wc -l)

	if [[ "$layout_count" -eq 1 ]]; then
		echo "$layouts"
		return
	fi

	local choice
	choice=$(echo "$layouts" |
		fzf-tmux -p 50,$((layout_count + 4)) --no-sort --ansi \
			--border-label ' quick-window ' --prompt '⚡  ')
	echo "$choice"
}

create_window_with_layout() {
	local work_path="$1"
	local layout="$2"
	local commands
	commands=$(get_commands_for_layout "$work_path" "$layout")

	local cwd
	cwd=$(tmux display-message -p '#{pane_current_path}')

	local window_index
	window_index=$(tmux new-window -c "$cwd" -n "$layout" -P -F '#{window_index}')
	local last_pane="$window_index.0"

	local index=0
	while IFS= read -r cmd; do
		if [[ -z "$cmd" ]]; then
			continue
		fi
		if [[ $index -eq 0 ]]; then
			tmux send-keys -t "$last_pane" "$cmd" C-m
		else
			last_pane=$(tmux split-window -h -c "$cwd" -t "$last_pane" -P -F '#{pane_id}')
			tmux send-keys -t "$last_pane" "$cmd" C-m
		fi
		index=$((index + 1))
	done <<<"$commands"

	tmux select-pane -t "$window_index.0"
}

main() {
	check_tmux
	check_config

	local cwd
	cwd=$(tmux display-message -p '#{pane_current_path}')

	local work_path
	work_path=$(jq -r --arg cwd "$cwd" 'keys[] | select(. == $cwd)' "$CONFIG_FILE")

	if [[ -z "$work_path" ]]; then
		echo "no configuration found for current path: $cwd" >&2
		exit 0
	fi

	local layout
	layout=$(select_layout "$work_path")

	if [[ -z "$layout" ]]; then
		exit 0
	fi

	create_window_with_layout "$work_path" "$layout"
}

main
