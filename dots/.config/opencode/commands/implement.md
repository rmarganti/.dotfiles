---
description: Implement a PRD
agent: general
subtask: false
---

Implement the PRD referenced by "$ARGUMENTS".

**How to find the PRD:**
1. If an argument is provided (e.g., `./local/plans/1234567890-user-auth.md` or just a slug like `user-auth`), look for a matching file in the `.local/plans/` directory.
2. If the argument is empty or no argument is provided, find the most recently modified `.md` file in `.local/plans/`.

Once you've found and read the PRD, implement it completely following all specifications in the document.
