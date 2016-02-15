#!/bin/bash

# Credit: https://github.com/mjacobus/.dotfiles

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
  if [ -f $2 ]; then
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
  if [ -f $2 ]; then
    backup_move $2 && ln -sf $1 $2
  else
    ln -sf $1 $2
  fi
}

symlink_or_ask ~/.dotfiles/shell/.bash_profile ~/.bashrc
symlink_or_ask ~/.dotfiles/shell/.bash_profile ~/.bash_profile
symlink_or_ask ~/.dotfiles/shell/.bash_aliases ~/.bash_aliases
symlink_or_ask ~/.dotfiles/shell/.bash_colors ~/.bash_colors

symlink_or_ask ~/.dotfiles/vim/ ~/.vim
symlink_or_ask ~/.dotfiles/vim/.vimrc ~/.vimrc

# install vundle
if [ ! -d ~/.dotfiles/vim/Vundle.vim ]; then
  cd ~/.dotfiles/vim && git clone https://github.com/gmarik/Vundle.vim.git
  vim +BundleInstall +BundleClean +BundleClean +quitall
fi

if [ ! -f ~/.git-prompt.sh ]; then
  curl -O https://raw.githubusercontent.com/git/git/master/contrib/completion/git-prompt.sh ~/.git-prompt.sh
fi

# install z
if [ ! -f ~/z.sh ]; then
  curl -O https://raw.githubusercontent.com/rupa/z/master/z.sh ~/z.sh
fi
