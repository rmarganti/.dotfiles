# General
alias cpwd='pwd | pbcopy'
alias ll='ls -alFh'
alias up='cd ..'
alias h='history'
alias uuid="uuidgen | tr 'A-Z' 'a-z' | tr -d '\n' | pbcopy"
alias userlist="cut -d: -f1 /etc/passwd"
alias stalk="telnet localhost 11300"

# Git
alias ga='git add'
alias gaa='git add --all'
alias gaam='git add --all; git commit -m'
alias gb='git branch'
alias gc='git commit'
alias gcm='git commit -m'
alias gd='git diff'
alias gf='git fetch'
alias gfl="git diff-tree --no-commit-id --name-only -r"
alias gl='git log'
alias glp="git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
alias gm='git merge'
alias go='git checkout'
alias grp='git remote prune origin'
alias gst='git status'
alias gt="git tag"
alias gunwip='git log -n 1 | grep -q -c "\-\-wip\-\-" && git reset HEAD~1'
alias gwip='git add -A; git rm $(git ls-files --deleted) 2> /dev/null; git commit --no-verify -m "--wip--"'

# Laravel
alias art='php artisan'
alias a:cc='php artisan cache:clear'

# Laravel Doctrine
alias d:ccm='vendor/doctrine/orm/bin/doctrine orm:clear-cache:metadata'
alias d:ccq='vendor/doctrine/orm/bin/doctrine orm:clear-cache:query'
alias d:ccr='vendor/doctrine/orm/bin/doctrine orm:clear-cache:result'
alias d:sc='art doctrine:schema:create'
alias d:sd='art doctrine:schema:drop'
alias d:su='art doctrine:schema:update'
alias d:sv='art doctrine:schema:validate'
alias d:ge='vendor/doctrine/orm/bin/doctrine orm:generate-entities .'
alias d:gp='art doctrine:generate:proxies'

# Composer aliases
alias cda='composer dump-autoload -o'
alias cu='composer update'

# PHPUnit
alias pu='./vendor/bin/phpunit'
function puf() {
    ./vendor/bin/phpunit --filter=$1
}
alias pus='./vendor/bin/phpunit --testsuite'

# Misc Functions
function strlen() {
    echo -n "$1" | wc -c
}

