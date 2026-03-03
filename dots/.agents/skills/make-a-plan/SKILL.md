---
name: make-a-plan
description: Create a detailed implementation plan with deep codebase research followed by a structured plan document. Use when the user wants to plan a feature, explore how to implement something, or needs a thorough plan before writing code. More rigorous than make-a-prd — includes deep research and specific implementation details.
---

# Skill: make-a-plan

This skill produces two artifacts in sequence: a `research.md` from deep codebase
exploration, then a `plan.md` with a concrete implementation strategy.

Each major step is performed via a subagent to keep context lean.

---

## Step 0 — Gather intent

Ask the user:

1. What feature or change do they want to implement?
2. Which part(s) of the codebase are most relevant (folders, systems, flows)?
3. Any known constraints, preferences, or reference implementations?

Do not proceed until you have a clear, specific description of the goal.

---

## Step 1 — Set up the plan directory

Run `date +%s` to get the current UTC timestamp.

Choose a concise, filesystem-friendly slug that describes the feature
(e.g. `user-auth-refresh`, `bulk-export-api`).

Create the directory:

```
.local/plans/${timestamp}-${slug}/
```

---

## Step 2 — Deep research (subagent)

Launch a **general subagent** with the following directive (adapt to the
user's specific topic):

> Read every relevant file in [the relevant folder / system / flow] in
> depth. Understand how it works deeply — the internals, the data shapes,
> the conventions, the edge cases, and any potential surprises. Do **not**
> skim. When finished, write a detailed `research.md` to
> `.local/plans/${timestamp}-${slug}/research.md`.
>
> The report must cover:
> - What the system does and why
> - Key files and their roles
> - Data shapes and types used
> - Conventions and patterns in use
> - External dependencies and integrations
> - Potential pitfalls, gotchas, or known bugs
> - Anything a developer must know before modifying this system
>
> Write for a developer who has never seen this code before but needs to
> make precise changes to it.

After the subagent completes, **read `research.md` yourself** and verify
the findings are accurate and complete before moving on. Correct any
clear misunderstandings with the user before proceeding.

---

## Step 3 — Implementation planning (subagent)

Launch a second **general subagent** with the following directive:

> Read `research.md` at `.local/plans/${timestamp}-${slug}/research.md`
> in full. Then read the relevant source files directly before proposing
> any changes — base all suggestions on the actual codebase.
>
> The goal is: [restate the user's goal in full detail].
>
> Write a detailed `plan.md` to
> `.local/plans/${timestamp}-${slug}/plan.md`.
>
> The plan must include:
> - A clear explanation of the overall approach and why it was chosen
> - Specific files that will be created or modified (with paths)
> - Code snippets showing the actual changes (not pseudocode)
> - Schema or API contract changes, if any
> - Trade-offs considered and decisions made
> - A granular, numbered todo list of every phase and individual task
>   required to complete the implementation
>
> Do **not** implement anything. Write the plan only.

---

## Step 4 — Present the artifacts

Tell the user:

- Where `research.md` and `plan.md` were written
- Invite them to review `plan.md` in their editor, add inline notes to
  anything that is wrong or needs changing, and then share it back so
  the plan can be refined before implementation begins
- Remind them: once the plan looks right, they can tell the agent to
  implement it — e.g. *"implement it all, mark each task complete in
  plan.md as you go, run typecheck continuously, do not stop until done"*
