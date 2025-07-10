# ------------------------------------------------
# Homebrew (login shell PATH setup)
# ------------------------------------------------

export PATH="/opt/homebrew/bin:$PATH"

# ------------------------------------------------
# pyenv (login shell setup)
# ------------------------------------------------

export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# ------------------------------------------------
# NVM (login shell setup)
# ------------------------------------------------

export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"

# ------------------------------------------------
# Source .bashrc for interactive and non-login shell config
# ------------------------------------------------

if [ -f ~/.bashrc ]; then
    . ~/.bashrc
fi
