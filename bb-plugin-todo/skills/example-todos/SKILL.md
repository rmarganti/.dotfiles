---
name: todo
description: Read and update the Todo plugin's task list with the `bb todo` CLI. Use when the user asks to add, complete, reopen, remove, or review tasks, or when the steps of a task should be tracked as todos.
---

# Todo

The Todo plugin keeps one task list. The To-Do page in the BB sidebar and
the `bb todo` command read and write the same list, so a change from either
side shows in the other at once.

## Commands

| Command | Effect |
| --- | --- |
| `bb todo list` | Show every todo with its id. `[x]` marks a done todo. |
| `bb todo add <title>` | Add a todo. Quote a title that has spaces. |
| `bb todo done <todo-id>` | Mark a todo done. |
| `bb todo undo <todo-id>` | Mark a todo not done. |
| `bb todo remove <todo-id>` | Delete a todo. |

Add `--json` to any command when the output drives code.

## Procedure

1. Run `bb todo list` before you change the list. Use the ids it prints;
   never guess an id.
2. Add todos one at a time with a short title that starts with a verb:
   `bb todo add "Write the release notes"`.
3. When you finish a todo, mark it done: `bb todo done <todo-id>`. Do not
   remove a todo to mark it done.
4. Remove a todo only when the user asks for it or when it duplicates
   another todo.
5. End with a short summary of what you added, completed, or removed.

## Rules

- Change the list only through `bb todo`. Do not edit bb.db or the plugin's
  storage directly.
- A non-zero exit with "No todo with id" means the id is stale: run
  `bb todo list` again.
