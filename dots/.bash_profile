# ------------------------------------------------
# Homebrew (must be executed first)
# ------------------------------------------------

export PATH="/opt/homebrew/bin:$PATH"

# ------------------------------------------------
# Misc
# ------------------------------------------------

export PRETTIERD_DEFAULT_CONFIG="/Users/rmarganti/.dotfiles/.prettierrc.json"
export VISUAL=nvim
export EDITOR="$VISUAL"
export XDG_CONFIG_HOME="$HOME/.config"

# ------------------------------------------------
# Source .bashrc for interactive and non-login shell config
# ------------------------------------------------

if [ -f ~/.bashrc ]; then
    . ~/.bashrc
fi
