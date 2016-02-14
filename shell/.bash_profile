. ~/.bash_aliases
. ~/.bash_colors
. ~/.git-prompt.sh
. ~/z.sh

export ANDROID_HOME=/usr/local/opt/android-sdk
export PATH=~/.composer/vendor/bin:$PATH

function vm()
{
    cd ~/code/
    status=$(vagrant status)

    if [[ $status == *poweroff* || $status == *aborted*  ]]; then
        echo 'Booting up Box'
        vagrant up
    fi

    vagrant ssh
}

export PS1="\[$txtblu\]\h\[$txtpur\]\$(__git_ps1) \[$txtgrn\]\W \[$txtwht\]\$ "
