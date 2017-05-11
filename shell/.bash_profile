. ~/.bash_aliases
. ~/.bash_colors
. ~/.git-prompt.sh
. ~/z.sh

export PATH=~/.composer/vendor/bin:$PATH

short_pwd() {
    charpath=${PWD%/*/*}

    if [[ "$OSTYPE" == "darwin"* ]]; then
        charpath=$(echo $charpath | sed -E 's|/(.)[^/]*|/\1|g')
    else
        charpath=$(echo $charpath | sed -r 's|/(.)[^/]*|/\1|g')
    fi

    tdir=$(pwd |rev| awk -F / '{print $1,$2}' | rev | sed s_\ _/_)
    number_of_dirs=$( grep -o "/" <<< "$PWD" | wc -l )

    if [[ $number_of_dirs -gt 2 ]]; then
        echo "$charpath/$tdir"
    else
        echo "$PWD"
    fi

}

export PS1="\[$txtblu\]\h\[$txtpur\]\$(__git_ps1) \[$txtgrn\]\$(short_pwd) \[$txtrst\]\$ "

if [ -f ~/.bash_profile_local ]; then
  . ~/.bash_profile_local
fi

test -e "${HOME}/.iterm2_shell_integration.bash" && source "${HOME}/.iterm2_shell_integration.bash"
