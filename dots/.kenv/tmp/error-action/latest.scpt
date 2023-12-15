tell application "Terminal"
  if not application "Terminal" is running then launch
  activate
  do script "nvim /Users/rmarganti/.kenv/logs/github-notifications.log"
  end tell
  