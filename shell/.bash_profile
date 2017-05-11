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
        if [[ ! $git_status =~ "working directory clean" ]]; then
          echo -e " \[$txtred\]$(__git_ps1)\[$txtrst\]"
        elif [[ $git_status =~ "Your branch is ahead of" ]]; then
          echo -e " \[$txtylw\]$(__git_ps1)\[$txtrst\]"
        elif [[ $git_status =~ "nothing to commit" ]]; then
          echo -e " \[$txtpur\]$(__git_ps1)\[$txtrst\]"
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

set_bash_prompt() {
    PS1="\[$txtblu\]\h$(parse_git_branch) \[$txtgrn\]$(short_pwd) \[$txtrst\]\$ "
}

PROMPT_COMMAND=set_bash_prompt

test -e "${HOME}/.iterm2_shell_integration.bash" && source "${HOME}/.iterm2_shell_integration.bash"

if [ -f ~/.bash_profile_local ]; then
  . ~/.bash_profile_local
fi
