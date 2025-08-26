#!/bin/bash

################################################################
#
# Helper functions
# Credit: https://github.com/mjacobus/.dotfiles
#
################################################################

function ask_should_symlink() {
    while true; do
        read -p "Do you want to symlink $1 to $2 ? " yn
        case $yn in
        [Yy]*)
            symlink_safe $1 $2
            break
            ;;
        [Nn]*) return ;;
        *) echo "Please answer yes or no." ;;
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
    SCRIPT_TIME=$(date +%Y%m%d%H_%M_%S)
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

#----------------------------------------------------------------
# Initial setup
#----------------------------------------------------------------

mkdir -p ~/.config

#----------------------------------------------------------------
# Shell
#----------------------------------------------------------------

# bash config
symlink_or_ask ~/.dotfiles/dots/.bashrc ~/.bashrc
symlink_or_ask ~/.dotfiles/dots/.bash_profile ~/.bash_profile
symlink_or_ask ~/.dotfiles/dots/.bash_aliases ~/.bash_aliases
symlink_or_ask ~/.dotfiles/dots/.bash_colors ~/.bash_colors

# git shell completion
if [ ! -f ~/.git-completion.bash ]; then
    curl https://raw.githubusercontent.com/git/git/master/contrib/completion/git-completion.bash -o ~/.git-completion.bash
fi

#----------------------------------------------------------------
# Git
#----------------------------------------------------------------

symlink_or_ask ~/.dotfiles/dots/.gitconfig ~/.gitconfig
symlink_or_ask ~/.dotfiles/dots/.gitignore.global ~/.gitignore.global

#----------------------------------------------------------------
# Vim + Neovim
#----------------------------------------------------------------

# vim config
symlink_or_ask ~/.dotfiles/dots/.vim ~/.vim
symlink_or_ask ~/.dotfiles/dots/.vimrc ~/.vimrc
symlink_or_ask ~/.dotfiles/dots/.config/nvim ~/.config/nvim
symlink_or_ask ~/.vim/coc-settings.json ~/.config/nvim/coc-settings.json

# install vim-plug
if [ ! -d ~/.dotfiles/editor/vim/autoload/plug.vim ]; then
    curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
        https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
    vim +PlugInstall +qall
fi

#----------------------------------------------------------------
# Misc
#----------------------------------------------------------------

symlink_or_ask ~/.dotfiles/dots/.config/bat ~/.config/bat
symlink_or_ask ~/.dotfiles/dots/.config/codebook ~/.config/codebook
symlink_or_ask ~/.dotfiles/dots/.config/ghostty ~/.config/ghostty
symlink_or_ask ~/.dotfiles/dots/.config/karabiner ~/.config/karabiner
symlink_or_ask ~/.dotfiles/dots/.config/lazygit ~/.config/lazygit
symlink_or_ask ~/.dotfiles/dots/.config/lf ~/.config/lf
symlink_or_ask ~/.dotfiles/dots/.config/opencode ~/.config/opencode
symlink_or_ask ~/.dotfiles/dots/.config/phpactor ~/.config/phpactor
symlink_or_ask ~/.dotfiles/dots/.config/television ~/.config/television
symlink_or_ask ~/.dotfiles/dots/.config/wezterm ~/.config/wezterm
symlink_or_ask ~/.dotfiles/dots/.config/zed ~/.config/zed
