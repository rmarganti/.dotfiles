---
name: ish
description: Create and manage issues in ish from markdown files and PRDs. Use when the user wants to break down a feature spec, PRD, or markdown document into actionable issues.
---

This skill creates issues in ish from a markdown file or PRD. Use when the user wants to convert a plan or spec into actionable issues.

## Workflow

1. **Identify the source**: The user should provide a markdown file path or the content directly. If they mention a file, read it first.

2. **Parse the content**: Analyze the markdown/PRD and identify actionable items:
   - User stories become top-level issues
   - Implementation tasks become child issues (subtasks)
   - Each story/task should have a clear title and description

3. **Create issues**: For each actionable item:
   - `ish add "title Use" --body "description"` for top-level issues
   - Use `ish add "title" --body "description" --parent <parent-id>` for subtasks
   - Set appropriate sort order using `ish edit <id> --sort <n>`

4. **Output**: After creating issues, run `ish list` to show all created issues with their IDs.

## ish Command Reference

```
# Add issue
ish add "Fix bug" --body "Description here"
ish add "Subtask" --parent <parent-id>

# List issues
ish list                    # all issues
ish list --status todo      # filter by status
ish list --parent <id>      # filter by parent

# Work on issues
ish next                    # show next todo issue
ish start <id>              # start working on issue
ish finish <id>             # mark issue as done

# Edit issues
ish edit <id> --title "New title"
ish edit <id> --body "New body"
ish edit <id> --sort 1      # set sort order

# View and delete
ish show <id>               # show issue details
ish delete <id>             # delete issue
```

## Tips

- Group related tasks under parent issues
- Use sort order to prioritize (lower = higher priority)
- The `next` command smartly skips blocked issues (those with incomplete children)
- Issues are stored in `.local/ish.db` by default, or use `--db-path <PATH>`
