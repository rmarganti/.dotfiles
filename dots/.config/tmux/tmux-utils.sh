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
	killall -9 opencode php nvim node 2>/dev/null
	tmux display-message "Killed opencode, php, nvim, node processes"
}

main() {
	local choice
	choice=$(printf "Clear all terminals\nRefresh bash env\nKill opencode, php, nvim, node" |
		fzf-tmux -p 40%,30% --no-sort --ansi --border-label ' tmux utils ' --prompt '⚡  ')

	case "$choice" in
	"Clear all terminals")
		clear_all_terminals
		;;
	"Refresh bash env")
		refresh_bash_env
		;;
	"Kill opencode, php, nvim, node")
		kill_processes
		;;
	esac
}

main
