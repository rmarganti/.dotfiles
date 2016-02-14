# General
alias ll='ls -lahG'
alias up='cd ..'
alias h='history'

# Git
alias gs='git status'
alias ga='git add'
alias gaa='git add .'
alias gb='git branch'
alias gc='git commit'
alias gcm='git commit -m'
alias gd='git diff'
alias go='git checkout'
alias gm='git merge'
alias gf='git fetch'
alias gl='git log'
alias glp="git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# Laravel
alias art='php artisan'
alias dbms='art migrate:refresh --seed'
alias a:cc='php artisan cache:clear'

# Laravel Doctrine
alias d:ccm='vendor/doctrine/orm/bin/doctrine orm:clear-cache:metadata'
alias d:ccq='vendor/doctrine/orm/bin/doctrine orm:clear-cache:query'
alias d:sc='art doctrine:schema:create'
alias d:sd='art doctrine:schema:drop'
alias d:su='art doctrine:schema:update'
alias d:sv='art doctrine:schema:validate'
alias d:ge='vendor/doctrine/orm/bin/doctrine orm:generate-entities .'

# Composer aliases
alias cda='composer dump-autoload -o'
alias cu='composer update'
