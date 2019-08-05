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

# vim config
symlink_or_ask ~/.dotfiles/vim ~/.vim
symlink_or_ask ~/.dotfiles/vim/.vimrc ~/.vimrc


# install vundle
if [ ! -d ~/.dotfiles/vim/autoload/plug.vim ]; then
  curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  vim +PlugInstall +qall
fi

# tmux config
symlink_or_ask ~/.dotfiles/tmux ~/.tmux
symlink_or_ask ~/.dotfiles/tmux/.tmux.conf ~/.tmux.conf

# install Tmux Plugin Manager
if [ ! -d ~/.dotfiles/tmux/plugins/tpm ]; then
  git clone https://github.com/tmux-plugins ~/.dotfiles/tmux/plugins/tpm
  ~/.tmux/plugins/tpm/scripts/install_plugins.sh
fi

# git shell completion
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
