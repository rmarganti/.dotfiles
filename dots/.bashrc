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
# pyenv
# ------------------------------------------------

export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# ------------------------------------------------
# NVM
# ------------------------------------------------

export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && . "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"

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
# NVM auto-switching (.nvmrc) for interactive shells
# ------------------------------------------------

_nvmrc_hook() {
    if [[ $PWD == $PREV_PWD ]]; then
        return
    fi

    PREV_PWD=$PWD
    if command -v nvm >/dev/null 2>&1 && [[ -f ".nvmrc" ]]; then nvm use; fi
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

if command -v gh >/dev/null 2>&1; then
    eval "$(gh completion -s bash)"
fi

# Rust Cargo env
[ -f "$HOME/.cargo/env" ] && . "$HOME/.cargo/env"

# Set default editor
export VISUAL=nvim
export EDITOR="$VISUAL"

# Load local-specific config if it exists (not committed to git)
[ -f ~/.local.bashrc ] && . ~/.local.bashrc

eval "$(starship init bash)"
