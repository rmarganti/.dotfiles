. ~/.bash_aliases
. ~/.bash_colors
. ~/z.sh

export PATH=~/.composer/vendor/bin:$PATH

# GIT integration
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
          echo -en " \001$txtpur\002$(__git_ps1)\001$txtrst\002"
        fi
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

    tdir=$(pwd |rev| awk -F / '{print $1,$2}' | rev | sed s_\ _/_)
    number_of_dirs=$( grep -o "/" <<< "$PWD" | wc -l )

    if [[ $number_of_dirs -gt 2 ]]; then
        echo "$charpath/$tdir"
    else
        echo "$PWD"
    fi

}

export PS1="\n\[$txtblu\]\h\$(parse_git_branch) \[$txtgrn\]\$(short_pwd) \[$txtrst\]\n\$ "

test -e "${HOME}/.iterm2_shell_integration.bash" && source "${HOME}/.iterm2_shell_integration.bash"

if [ -f ~/.bash_profile_local ]; then
  . ~/.bash_profile_local
fi
