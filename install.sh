#!/bin/bash

################################################################
# Helper functions
# Credit: https://github.com/mjacobus/.dotfiles
################################################################

function ask_should_symlink() {
    while true; do
        read -p "Do you want to symlink $1 to $2 ? " yn
        case $yn in
            [Yy]* ) symlink_safe $1 $2; break;;
            [Nn]* ) return ;;
            * ) echo "Please answer yes or no.";
        esac
    done
}

function symlink_or_ask() {
    if [ -L $2 ]; then
        echo "$1 is already linked to $2"
    elif [ -d $2 ]; then
        ask_should_symlink $1 $2
    elif [ -f $2 ]; then
        ask_should_symlink $1 $2
    else
        ln -s $1 $2
    fi
}

function backup_move() {
    SCRIPT_TIME=`date +%Y%m%d%H_%M_%S`
    mv $1 "${1}_${SCRIPT_TIME}"
}

function symlink_safe() {
    echo "symlinking $1 to $2"
    if [ -f $2 ]; then
        backup_move $2 && ln -sf $1 $2
    else
        ln -sf $1 $2
    fi
}


################################################################
# Shell
################################################################

# bash config
symlink_or_ask ~/.dotfiles/shell/bashrc ~/.bashrc
symlink_or_ask ~/.dotfiles/shell/bash_profile ~/.bash_profile
symlink_or_ask ~/.dotfiles/shell/bash_aliases ~/.bash_aliases
symlink_or_ask ~/.dotfiles/shell/bash_colors ~/.bash_colors

# tmux config
symlink_or_ask ~/.dotfiles/shell/tmux ~/.tmux
symlink_or_ask ~/.dotfiles/shell/tmux.conf ~/.tmux.conf

# install Tmux Plugin Manager
if [ ! -d ~/.dotfiles/shell/tmux/plugins/tpm ]; then
    git clone https://github.com/tmux-plugins/tpm.git ~/.dotfiles/shell/tmux/plugins/tpm
    ~/.tmux/plugins/tpm/scripts/install_plugins.sh
fi

# git shell completion and PS1 extension
if [ ! -f ~/.git-completion.bash ]; then
    curl https://raw.githubusercontent.com/git/git/master/contrib/completion/git-completion.bash -o ~/.git-completion.bash
fi

if [ ! -f ~/.git-prompt.sh ]; then
    curl https://raw.githubusercontent.com/git/git/master/contrib/completion/git-prompt.sh -o ~/.git-prompt.sh
fi

# install z
if [ ! -f ~/z.sh ]; then
    curl https://raw.githubusercontent.com/rupa/z/master/z.sh -o ~/z.sh
fi

# install fzf
if [ ! -d ~/.fzf ]; then
    git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
    ~/.fzf/install
fi


################################################################
# VIM
################################################################

# vim config
symlink_or_ask ~/.dotfiles/editor/vim ~/.vim
symlink_or_ask ~/.dotfiles/editor/vimrc ~/.vimrc

# install vim-plug
if [ ! -d ~/.dotfiles/editor/vim/autoload/plug.vim ]; then
    curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
        https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
    vim +PlugInstall +qall
fi
