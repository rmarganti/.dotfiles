---
name: simplify
description: Audit a user-specified code scope for materially useful simplifications without changing it.
disable-model-invocation: true
---

# Simplify

Audit the requested scope for materially useful simplifications in its data structures, state representation, control flow, algorithms, and ownership.

This is an audit-only exercise. Do not edit repository files, run tests, implement recommendations, commit, or push. Read-only inspection commands are allowed. If a report or scratchpad is needed, write it outside the repository in the OS temporary directory.

You are the coordinator. Continue until the complete requested scope has been reviewed and the final audit is validated.

## 1. Resolve the audit target

Derive the target from the user's request. Supported targets include:

- the entire repository;
- unstaged changes;
- staged changes;
- all local/uncommitted changes;
- a specific commit;
- the difference between two commits, branches, tags, or other git refs;
- a pull request;
- one or more files, directories, packages, apps, or other sections of a repository;
- an explicit combination of the above, such as unstaged changes within one app.

Use repository metadata and read-only git or forge commands to resolve the target precisely. For diff-based targets, inventory the changed files and inspect the relevant diff. For a single commit, normally audit the change introduced by that commit (`<commit>^..<commit>`), unless the user clearly asks for the repository snapshot at that commit. For a pull request, resolve its base, head, and changed files. Do not check out another ref or otherwise modify the worktree.

If the target is omitted or materially ambiguous, ask one concise clarifying question rather than assuming the entire repository.

State a scope contract before reviewing. It must identify:

- the exact target and, where applicable, resolved refs or merge base;
- included files and subsystems;
- explicit exclusions;
- whether findings should concern only changed code or may include pre-existing code directly implicated by the change.

Treat files outside the scope as context only. Inspect public interfaces, callers, dependencies, and tests outside the target when needed to validate a finding, but do not silently expand the audit into those areas. If a useful simplification requires out-of-scope changes, identify those changes as dependencies or follow-up scope.

## 2. Establish the coverage contract

Inventory every identifiable subsystem or review unit within the resolved target. Choose review units proportional to the target: changed hunks or files for a small diff, packages or apps for a section of a monorepo, and subsystems for a repository-wide audit.

Give each review unit:

- a stable ID and descriptive name;
- an exact ownership boundary;
- its in-scope implementation files or changed hunks;
- relevant public interfaces, major call sites, and tests, including contextual files outside the scope where necessary;
- a status: queued, in review, recommend, or skip.

Include frontend, backend, shared infrastructure, platform bridges, generated-contract ownership, and test/tooling infrastructure only where they intersect the target materially.

Create one canonical temporary scratchpad or report containing:

- the scope contract;
- the review-unit inventory;
- confirmed opportunities;
- explicit skip decisions;
- cross-cutting patterns;
- duplicates and superseded findings;
- final priorities and dependencies;
- an audit log.

Treat this inventory as the coverage contract. Do not assume broad catch-all rows prove coverage.

## 3. Run bounded reviews

Use fresh, read-only agents where available. Give every worker one distinct review unit with an exact, non-overlapping ownership boundary.

Keep concurrency bounded to the number of lanes you can actively coordinate. Use one consolidated wait mechanism, do not interrupt productive workers merely because they are slow, and close completed workers after harvesting their results.

Each worker receives this brief:

> Review the assigned scope for at most two materially useful simplifications in its data structures, state representation, control flow, algorithms, or organizing model.
>
> Inspect its implementation, diff where applicable, public interfaces, major call sites, and existing tests. Stay within the assigned ownership boundary. You may inspect and identify cross-boundary concerns, but do not expand the scope to solve them.
>
> Look for:
>
> - scattered booleans or nullable fields that permit invalid combinations and should become a state machine or discriminated union;
> - repeated assumptions about object shape that need a shared typed model;
> - duplicated branching that a small map, registry, reducer, or command model would remove;
> - unclear state or behavior ownership that a small module boundary would clarify;
> - repeated scans, transformations, or lookups where a more appropriate collection or index would materially simplify behavior;
> - lifecycle, concurrency, or async states whose representation permits stale or contradictory state.
>
> Do not force an abstraction. Prefer boring local code when it is already clear.
>
> Do not recommend changes solely for stylistic consistency, hypothetical extensibility, minor line-count reduction, or moving existing branching behind a new type.
>
> Return at most two opportunities. If nothing clearly meets the threshold, return `skip`.
>
> For every recommendation, provide:
>
> 1. Verdict: recommend or skip.
> 2. Evidence with exact file and line references; include diff references when the target is change-based.
> 3. Current complexity or invalid states.
> 4. Proposed representation and why it is simpler.
> 5. Smallest credible implementation scope, including affected files and interfaces, and flag anything outside the audit target.
> 6. Regression risks and migration concerns.
> 7. Existing and additional validation required.
> 8. Confidence: high, medium, or low.

## 4. Validate and synthesize

Independently verify every finding against the current repository and, for change-based audits, against the resolved diff or snapshot before accepting it.

Reject, narrow, or demote recommendations that are vague, duplicate another finding, misunderstand intentional semantics, are unrelated to the requested target, or merely relocate complexity.

Record skips as completed coverage. Deduplicate overlapping findings and assign each accepted recommendation to one authoritative review unit.

Continue opening bounded review batches until every inventory row is complete.

## 5. Audit the audit

Before finishing, run fresh independent passes for:

- target coverage and missing review-unit boundaries;
- accidental scope expansion;
- duplication and ownership overlap;
- materiality and over-abstraction;
- schema completeness;
- dependency-aware priority ranking.

If the coverage pass finds a real omission inside the target, add an explicit review-unit row and audit it. Do not hide it by broadening a previously completed boundary.

Rank the final recommendations by concrete impact, confidence, implementation effort, blast radius, and prerequisites. Identify the best first implementation slices. Clearly distinguish in-scope edits from required or optional out-of-scope follow-ups.

The audit is complete only when:

- every review unit in the requested target has been reviewed;
- every review unit has a recommendation or explicit skip;
- every finding has complete evidence, scope, risk, and validation fields;
- duplicates and weak abstractions have been removed;
- priorities and dependencies are internally consistent;
- the repository remains unchanged.
