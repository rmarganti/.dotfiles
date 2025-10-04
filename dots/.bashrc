# ~/.bashrc -- Interactive shell configuration

# Only proceed if this is an interactive shell
case $- in
*i*) ;;
*) return ;;
esac

# ------------------------------------------------
# Imports
# ------------------------------------------------

[ -f ~/.bash_aliases ] && . ~/.bash_aliases
[ -f ~/.bash_colors ] && . ~/.bash_colors
if command -v git >/dev/null 2>&1 && [ -f ~/.git-completion.bash ]; then
    . ~/.git-completion.bash
fi

# ------------------------------------------------
# fzf Integration
# ------------------------------------------------

if command -v fzf >/dev/null 2>&1; then
    eval "$(fzf --bash)"
    export FZF_COMPLETION_TRIGGER='~~'
    if command -v rg >/dev/null 2>&1; then
        export FZF_DEFAULT_COMMAND="rg --files --no-ignore-vcs --hidden -g '!node_modules/*' -g '!.git/*'"
    fi
fi

# ------------------------------------------------
# Command line prompt and helpers
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
# NVM auto-switching (.nvmrc) for interactive shells
# ------------------------------------------------

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

# ------------------------------------------------
# NX Aliases & Functions
# ------------------------------------------------

alias nxb="nx build"
alias nxdmc="nx db-migration-create"
alias nxdmg="nx db-migration-generate"
alias nxdmr="nx db-migration-run"
alias nxt="nx test"

# NX Serve
nxs() {
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
nxswd() {
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

if [ -n "${GHOSTTY_RESOURCES_DIR}" ]; then
    builtin source "${GHOSTTY_RESOURCES_DIR}/shell-integration/bash/ghostty.bash"
fi

# ------------------------------------------------
# Misc Interactive Config
# ------------------------------------------------

# https://github.com/ajeetdsouza/zoxide
if command -v zoxide >/dev/null 2>&1; then
    eval "$(zoxide init bash)"
fi

# Set default editor
export VISUAL=nvim
export EDITOR="$VISUAL"

# Load local-specific config if it exists (not committed to git)
[ -f ~/.local.bashrc ] && . ~/.local.bashrc

source "$HOME/.cargo/env"
