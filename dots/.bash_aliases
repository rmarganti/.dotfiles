# ------------------------------------------------
# General
# ------------------------------------------------

# Enable color for `ls` command
export CLICOLOR=1 # For BSD/Darwin
ls --color=auto &>/dev/null && alias ls='ls --color=auto' ||
	alias cpwd='pwd | pbcopy'
alias ll='ls -alFh'
alias up='cd ..'
alias userlist="cut -d: -f1 /etc/passwd"

# z hurts my pinky :(
alias j="zi"
alias z=""

# Restart service (via systemctl)
alias sysr="systemctl | fzf | cut -d' ' -f1 | xargs sudo systemctl restart"

# ------------------------------------------------
# Git
# ------------------------------------------------

# Git Add All and Commit
alias gaac='git add -A && git commit';

# Git Branch Copy -- Copy name to clipboard.
alias gbc='git branch | grep -E "\* (.+)" | sed "s/* //" | xargs echo | tr -d "\n" | pbcopy'

# Gif File List -- List files affected by a git ref
alias gfl="git diff-tree --no-commit-id --name-only -r"

# Git Log Pretty
alias glp="git log --graph --pretty=format:'%C(black)%h %C(green)(%ci)%C(reset) %s %C(black)<%an>%C(brightblack bold)%d%C(reset)' --abbrev-commit"

# Git Remote Prune
alias grp='git remote prune origin'

# Git Tag
alias gt="git tag --sort=v:refname"

# Git Work In Progress
alias gwip='git add -A; git rm $(git ls-files --deleted) 2> /dev/null; git commit --no-verify -m "--wip--"'

# Git Un-work In Progress
alias gunwip='git log -n 1 | grep -q -c "\-\-wip\-\-" && git reset HEAD~1'

# Git Push Upstream Origin
alias gpuo='git branch | grep -E "\* (.+)" | sed "s/* //" | xargs git push -u origin'

# Git Push Force with Lease
alias gpfl='git push --force-with-lease'

# Git Branch -- Select a branch to checkout using FZF.
function gb() {
	local branches branch query
	query="$*"
	branches=$(git branch --all | grep -v HEAD) &&
		branch=$(echo "$branches" | fzf --height=40% --query="$query" +m) &&
		git checkout $(echo "$branch" | sed "s/.* //" | sed "s#remotes/[^/]*/##")
}

alias glNoGraph='git log --color=always --format="%C(auto)%h%d %s %C(black)%C(bold)%cr% C(auto)%an" "$@"'
_gitLogLineToHash="echo {} | grep -o '[a-f0-9]\{7\}' | head -1"
_viewGitLogLine="$_gitLogLineToHash | xargs -I % sh -c 'git show --color=always % | diff-so-fancy'"

# Git Commit -- Select commit to checkout using FZF.
function gc() {
	local commit
	commit=$(glNoGraph |
		fzf --no-sort --reverse --tiebreak=index --no-multi \
			--ansi --preview="$_viewGitLogLine") &&
		git checkout $(echo "$commit" | sed "s/ .*//")
}

# Git Branch Delete
function gbd() {
	local branches branch query
	query="$*"
	branches=$(git --no-pager branch) &&
		branch=$(echo "$branches" | fzf --height=40% --query="$query" +m) &&
		git branch -d $(echo "$branch" | awk '{print $1}' | sed "s/.* //")
}

# ------------------------------------------------
# PHP
# ------------------------------------------------

alias art='php artisan'
alias acc='php artisan cache:clear'

# -[ Laravel Doctrine ]---------------------------

alias dcc='php artisan doctrine:clear:metadata:cache && php artisan doctrine:clear:query:cache && php artisan doctrine:clear:result:cache && php artisan doctrine:generate:proxies'
alias dge='vendor/doctrine/orm/bin/doctrine orm:generate-entities .'
alias dmd='php artisan doctrine:migrations:diff'
alias dmg='php artisan doctrine:migrations:generate'
alias dmm='php artisan doctrine:migrations:migrate'
alias dmr='php artisan doctrine:migrations:rollback'
alias dms='php artisan doctrine:migrations:status'
alias dsc='php artisan doctrine:schema:create'
alias dsd='php artisan doctrine:schema:drop'
alias dsu='php artisan doctrine:schema:update'
alias dsv='php artisan doctrine:schema:validate'

# -[ Composer ]-----------------------------------

alias cda='composer dump-autoload -o'

# -[ PHPUnit ]------------------------------------

alias pu='./vendor/bin/phpunit'
function puf() {
	./vendor/bin/phpunit --filter=$1
}

alias pus='./vendor/bin/phpunit --testsuite'

# -[ PHPStan ]------------------------------------

alias psa='./vendor/bin/phpstan analyse'

# ------------------------------------------------
# Kubernetes
# ------------------------------------------------

# Get Pods
alias kgp="kubectl get pods"

# Get Pods Loop
alias kgpl="while true; do kubectl get pods; echo; echo; sleep 5; done"

# Describe Pod
alias kdp="kubectl get pods --no-headers | fzf | awk '{print \$1}' | xargs -o -I % kubectl describe pod %"

# Exec - Open shell in pod
alias ke="kubectl get pods --no-headers | fzf | awk '{print \$1}' | xargs -o -I % kubectl exec -it % -- sh"

# Logs
alias kl="kubectl get pods --no-headers | fzf | awk '{print \$1}' | xargs -o -I % kubectl logs % -f"

# Copy pod
alias kcp="kubectl get pods --no-headers | fzf | awk '{print \$1}' | tr 'A-Z' 'a-z' | pbcopy"

# ------------------------------------------------
# Misc
# ------------------------------------------------

function strlen() {
	echo -n "$1" | wc -c
}
