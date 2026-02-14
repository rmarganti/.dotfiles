#!/usr/bin/env bash

get_idle_panes() {
	tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index} #{pane_current_command}" |
		awk '$2 == "bash" || $2 == "sh" {print $1}'
}

clear_all_terminals() {
	local panes
	panes=$(get_idle_panes)
	if [[ -z "$panes" ]]; then
		tmux display-message "No idle bash terminals found"
		return
	fi
	while IFS= read -r pane; do
		tmux send-keys -t "$pane" C-l
	done <<<"$panes"
	tmux display-message "Cleared all idle terminals"
}

refresh_bash_env() {
	local panes
	panes=$(get_idle_panes)
	if [[ -z "$panes" ]]; then
		tmux display-message "No idle bash terminals found"
		return
	fi
	while IFS= read -r pane; do
		tmux send-keys -t "$pane" "source ~/.bash_profile" C-m
	done <<<"$panes"
	tmux display-message "Refreshed bash env in all idle terminals"
}

kill_processes() {
	killall -9 nvim node opencode php 2>/dev/null
	tmux display-message "Killed opencode, php, nvim, node processes"
}

choices=(
	"Clear all terminals"
	"Refresh bash env"
	"Kill nvim, node, opencode, php"
)

choice_count=${#choices[@]}
height=$((choice_count + 4))

main() {
	local choice
	choice=$(printf '%s\n' "${choices[@]}" |
		fzf-tmux -p 50,$height --no-sort --ansi --border-label ' tmux utils ' --prompt '⚡  ')

	case "$choice" in
	"Clear all terminals")
		clear_all_terminals
		;;
	"Refresh bash env")
		refresh_bash_env
		;;
	"Kill nvim, node, opencode, php")
		kill_processes
		;;
	esac
}

main
