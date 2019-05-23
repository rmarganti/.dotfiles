# General
alias cpwd='pwd | pbcopy'
alias ll='ls -alFh'
alias up='cd ..'
alias h='history'
alias uuid="uuidgen | tr 'A-Z' 'a-z' | tr -d '\n' | pbcopy"
alias userlist="cut -d: -f1 /etc/passwd"
alias stalk="telnet localhost 11300"

# Git
alias g:a='git add'
alias g:aa='git add --all'
alias g:am='git add --all; git commit -m'
alias g:b='git branch'
alias g:bc='gb | grep -E "\* (.+)" | sed "s/* //" | xargs echo | tr -d "\n" | pbcopy'
alias g:c='git commit'
alias g:cm='git commit -m'
alias g:d='git diff'
alias g:f='git fetch --tags --prune'
alias g:fl="git diff-tree --no-commit-id --name-only -r"
alias g:l='git log'
alias g:lp="git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
alias g:m='git merge'
alias g:o='git checkout'
alias g:p='git pull'
alias g:rp='git remote prune origin'
alias g:st='git status'
alias g:t="git tag"
alias g:unwip='git log -n 1 | grep -q -c "\-\-wip\-\-" && git reset HEAD~1'
alias g:wip='git add -A; git rm $(git ls-files --deleted) 2> /dev/null; git commit --no-verify -m "--wip--"'
alias g:puo='git branch | grep -E "\* (.+)" | sed "s/* //" | xargs git push -u origin'

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
alias d:mg='art doctrine:migrations:generate'
alias d:mm='art doctrine:migrations:migrate'
alias d:mr='art doctrine:migrations:rollback'

# Composer aliases
alias c:da='composer dump-autoload -o'
alias c:u='composer update'

# PHPUnit
alias pu='./vendor/bin/phpunit'
function pu:f() {
    ./vendor/bin/phpunit --filter=$1
}
alias pu:s='./vendor/bin/phpunit --testsuite'

# Misc Functions
function strlen() {
    echo -n "$1" | wc -c
}

