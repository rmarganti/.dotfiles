---
description: Implement a plan
agent: general
subtask: false
---

Implement the plan referenced by "$ARGUMENTS".

**How to find the plan:**

1. If an argument is provided (e.g., `./.local/plans/1234567890-html-to-plaintext-newlines/` or just a slug like `html-to-plaintext-newlines`), look for a matching directory in the `.local/plans/` directory.
2. If the argument is empty or no argument is provided, find the last directory in the sort order in `.local/plans/`.

Once you've found the plan directory, read `plan.md` inside it and implement it completely following all specifications in the document.
