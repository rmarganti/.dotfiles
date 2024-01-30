################################################################
#
# Homebrew
#
################################################################

export PATH="/opt/homebrew/bin:$PATH"

################################################################
#
# Imports
#
################################################################

. ~/.bash_aliases
. ~/.bash_colors
. ~/.git-completion.bash

################################################################
#
# fzf Integration
#
################################################################

[ -f ~/.fzf.bash ] && source ~/.fzf.bash

# Use ~~ as the fzf trigger sequence instead of the default **
export FZF_COMPLETION_TRIGGER='~~'

# Use ag instead of find
export FZF_DEFAULT_COMMAND="rg --files --no-ignore-vcs --hidden -g '!node_modules/*' -g '!.git/*'"

################################################################
#
# Command line
#
################################################################

export PS1="\[$bldblk\]┌ \[$txtblu\]\h\$(parse_git_branch)\[$txtrst\]\[$txtblk\]\$(responsive_break)\[$txtcyn\]\$(short_pwd) \[$txtrst\]\n\[$bldblk\]└ \[$txtrst\]\$ "

# Git integration
alias __git_ps1="git branch 2>/dev/null | grep '*' | sed 's/* \(.*\)/\(\1\)/'"
parse_git_branch() {
	git_status=$(git status 2>/dev/null)
	git_error=$(git status 2>&1)

	if [[ ! $git_error =~ "fatal" ]]; then
		if [[ ! $git_status =~ working\ (tree|directory)\ clean ]]; then
			echo -en " \001$txtred\002$(__git_ps1)\001$txtrst\002"
		elif [[ $git_status =~ "Your branch is ahead of" ]]; then
			echo -en " \001$txtylw\002$(__git_ps1)\001$txtrst\002"
		elif [[ $git_status =~ "nothing to commit" ]]; then
			echo -en " \001$txtgrn\002$(__git_ps1)\001$txtrst\002"
		fi
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

################################################################
#
# Rust
#
################################################################

if [ -f "$HOME/.cargo/env" ]; then
	. "$HOME/.cargo/env"
fi

################################################################
#
# Misc
#
################################################################

# https://github.com/ajeetdsouza/zoxide
eval "$(zoxide init bash)"

# Set default editor
export VISUAL=nvim
export EDITOR="$VISUAL"

# Load local-specific config if it exists (not committed to git)
if [ -f ~/.local.bashrc ]; then
	. ~/.local.bashrc
fi
