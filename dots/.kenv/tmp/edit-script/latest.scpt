tell application "Terminal"
  if not application "Terminal" is running then launch
  activate
  do script "nvim /Users/rmarganti/.kenv/scripts/new.js"
  end tell
  