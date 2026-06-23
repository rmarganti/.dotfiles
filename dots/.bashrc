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
# git tab completion — source directly (rarely changes)
[ -f ~/.git-completion.bash ] && . ~/.git-completion.bash

# ------------------------------------------------
# Mise (shims mode — avoids sourcing complex shell code on every startup)
# Tools are still version-aware via shims (.nvmrc / .tool-versions respected).
# If you need per-directory switching notifications, change to:
#   eval "$(mise activate bash)"
# ------------------------------------------------

if command -v mise >/dev/null 2>&1; then
    export PATH="$HOME/.local/share/mise/shims:$PATH"
fi

# ------------------------------------------------
# fzf Integration
# ------------------------------------------------

# Cache generated shell integration so startup can source a file instead of
# running `fzf --bash` on every new shell. Regenerate when the binary changes.
_fzf_bin=$(command -v fzf 2>/dev/null)
if [[ -n "$_fzf_bin" ]]; then
    _fzf_cache="$HOME/.cache/fzf_init.bash"
    if [[ ! -f "$_fzf_cache" || "$_fzf_bin" -nt "$_fzf_cache" ]]; then
        mkdir -p "$(dirname "$_fzf_cache")"
        fzf --bash > "$_fzf_cache" 2>/dev/null || true
    fi
    [ -f "$_fzf_cache" ] && . "$_fzf_cache"
    export FZF_COMPLETION_TRIGGER='~~'
    if command -v rg >/dev/null 2>&1; then
        export FZF_DEFAULT_COMMAND="rg --files --no-ignore-vcs --hidden -g '!node_modules/*' -g '!.git/*' -g '!.yarn/*'"
    fi
    unset _fzf_bin _fzf_cache
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

# https://github.com/ajeetdsouza/zoxide (cached)
# Cache generated shell integration so startup only sources a file. Regenerate
# when the zoxide binary is newer than the cached init script.
_zoxide_bin=$(command -v zoxide 2>/dev/null)
if [[ -n "$_zoxide_bin" ]]; then
    _zoxide_cache="$HOME/.cache/zoxide_init.bash"
    if [[ ! -f "$_zoxide_cache" || "$_zoxide_bin" -nt "$_zoxide_cache" ]]; then
        mkdir -p "$(dirname "$_zoxide_cache")"
        zoxide init bash > "$_zoxide_cache" 2>/dev/null || true
    fi
    [ -f "$_zoxide_cache" ] && . "$_zoxide_cache"
    unset _zoxide_bin _zoxide_cache
fi

# gh completion — cached to avoid forking gh binary every shell start.
# Regenerate the completion file if it is missing or older than the gh binary.
_gh_bin=$(command -v gh 2>/dev/null)
if [[ -n "$_gh_bin" ]]; then
    _gh_cache="$HOME/.cache/gh_completion.bash"
    if [[ ! -f "$_gh_cache" || "$_gh_bin" -nt "$_gh_cache" ]]; then
        mkdir -p "$(dirname "$_gh_cache")"
        gh completion -s bash > "$_gh_cache" 2>/dev/null || true
    fi
    [ -f "$_gh_cache" ] && . "$_gh_cache"
    unset _gh_cache _gh_bin
fi

# Rust Cargo env
[ -f "$HOME/.cargo/env" ] && . "$HOME/.cargo/env"

# Load local-specific config if it exists (not committed to git)
[ -f ~/.local.bashrc ] && . ~/.local.bashrc

# starship — cached to avoid forking on every shell start.
# Source the cached prompt init, refreshing it only after starship updates.
_starship_bin=$(command -v starship 2>/dev/null)
if [[ -n "$_starship_bin" ]]; then
    _starship_cache="$HOME/.cache/starship_init.bash"
    if [[ ! -f "$_starship_cache" || "$_starship_bin" -nt "$_starship_cache" ]]; then
        mkdir -p "$(dirname "$_starship_cache")"
        starship init bash --print-full-init > "$_starship_cache" 2>/dev/null || true
    fi
    [ -f "$_starship_cache" ] && . "$_starship_cache"
    unset _starship_cache _starship_bin
fi
