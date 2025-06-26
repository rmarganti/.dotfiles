# ------------------------------------------------
# Homebrew
# ------------------------------------------------

export PATH="/opt/homebrew/bin:$PATH"

# ------------------------------------------------
# Imports
# ------------------------------------------------

. ~/.bash_aliases
. ~/.bash_colors
. ~/.git-completion.bash

# ------------------------------------------------
# fzf Integration
# ------------------------------------------------

eval "$(fzf --bash)"

# Use ~~ as the fzf trigger sequence instead of the default **
export FZF_COMPLETION_TRIGGER='~~'

# Use ag instead of find
export FZF_DEFAULT_COMMAND="rg --files --no-ignore-vcs --hidden -g '!node_modules/*' -g '!.git/*'"

# ------------------------------------------------
# Command line
# ------------------------------------------------

export PS1="\[$bldblk\]┌ \[$txtblu\]\h\$(parse_git_branch)\[$txtrst\]\[$txtblk\]\$(responsive_break)\[$txtcyn\]\$(short_pwd) \[$txtrst\]\n\[$bldblk\]└ \[$txtrst\]\$ "

# Git integration
alias __git_ps1="git branch 2>/dev/null | grep '*' | sed 's/* \(.*\)/\(\1\)/'"
parse_git_branch() {
	git_status=$(git status 2>/dev/null)
	git_error=$(git status 2>&1)

	if [[ $git_error =~ "fatal" ]]; then
		return
	elif [[ ! $git_status =~ working\ (tree|directory)\ clean ]]; then
		echo -en " \001$txtred\002$(__git_ps1)\001$txtrst\002"
	elif [[ $git_status =~ "Your branch is ahead of" ]]; then
		echo -en " \001$txtylw\002$(__git_ps1)\001$txtrst\002"
	elif [[ $git_status =~ "nothing to commit" ]]; then
		echo -en " \001$txtgrn\002$(__git_ps1)\001$txtrst\002"
	fi
}

responsive_break() {
	if [[ $(tput cols) -lt 110 ]]; then
		echo -en "\n│ "
	else
		echo -en " "
	fi
}

# Abbreviated current working directory
short_pwd() {
	charpath=${PWD%/*/*}

	if [[ "$OSTYPE" == "darwin"* ]]; then
		charpath=$(echo $charpath | sed -E 's|/(.)[^/]*|/\1|g')
	else
		charpath=$(echo $charpath | sed -r 's|/(.)[^/]*|/\1|g')
	fi

	tdir=$(pwd | rev | awk -F / '{print $1,$2}' | rev | sed s_\ _/_)
	number_of_dirs=$(grep -o "/" <<<"$PWD" | wc -l)

	if [[ $number_of_dirs -gt 2 ]]; then
		echo "$charpath/$tdir"
	else
		echo "$PWD"
	fi

}

# ------------------------------------------------
# Rust
# ------------------------------------------------

if [ -f "$HOME/.cargo/env" ]; then
	. "$HOME/.cargo/env"
fi

# ------------------------------------------------
# pyenv
# ------------------------------------------------

export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# ------------------------------------------------
# NVM
# ------------------------------------------------

export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"                                       # This loads nvm
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" # This loads nvm bash_completion

_nvmrc_hook() {
	if [[ $PWD == $PREV_PWD ]]; then
		return
	fi

	PREV_PWD=$PWD
	[[ -f ".nvmrc" ]] && nvm use
}

if ! [[ "${PROMPT_COMMAND:-}" =~ _nvmrc_hook ]]; then
	PROMPT_COMMAND="_nvmrc_hook${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
fi

# Github CLI
eval "$(gh completion -s bash)"

# ------------------------------------------------
# NX
# ------------------------------------------------

alias nxb="nx build"
alias nxdmc="nx db-migration-create"
alias nxdmg="nx db-migration-generate"
alias nxdmr="nx db-migration-run"
alias nxt="nx test"

# NX Serve
function nxs() {
	local query
	query="$*"

	# If a query was provided, just run the serve command
	if [ -n "$query" ]; then
		nx serve "$query"
		return
	fi

	nx show projects --projects "apps/*" | fzf | xargs nx serve
}

# NX Serve with Dependencies
function nxswd() {
	local query
	query="$*"
	# If a query was provided, just run the serve command
	if [ -n "$query" ]; then
		nx serve-with-dependencies "$query"
		return
	fi

	nx show projects --projects "apps/*" | fzf | xargs nx serve-with-dependencies
}

# ------------------------------------------------
# GhosTTY
# ------------------------------------------------

# Ghostty shell integration for Bash. This should be at the top of your bashrc!
if [ -n "${GHOSTTY_RESOURCES_DIR}" ]; then
	builtin source "${GHOSTTY_RESOURCES_DIR}/shell-integration/bash/ghostty.bash"
fi

# ------------------------------------------------
# Misc
# ------------------------------------------------

# https://github.com/ajeetdsouza/zoxide
eval "$(zoxide init bash)"

# Set default editor
export VISUAL=nvim
export EDITOR="$VISUAL"

# Load local-specific config if it exists (not committed to git)
if [ -f ~/.local.bashrc ]; then
	. ~/.local.bashrc
fi
