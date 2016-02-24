. ~/.bash_aliases
. ~/.bash_colors
. ~/.git-prompt.sh
. ~/z.sh

export PATH=~/.composer/vendor/bin:$PATH

export PS1="\[$txtblu\]\h\[$txtpur\]\$(__git_ps1) \[$txtgrn\]\W \[$txtrst\]\$ "

if [ -f ~/.bash_profile_local ]; then
  . ~/.bash_profile_local
fi
