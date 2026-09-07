---
name: simplify
description: Simplify code without changing behavior. Use after making changes, or when asked to simplify a repository, feature, module, file, directory, or other code scope.
disable-model-invocation: true
---

# Simplify

Simplify the requested code while preserving behavior exactly. Do not add features or fix unrelated bugs.

## Resolve the scope

Use the scope specified by the user:

- **Recent changes (default):** Review the changes just made in the current task. Use the diff to identify them, then inspect the surrounding code needed to understand them.
- **Change target:** Support unstaged, staged, or all uncommitted changes; a commit; a ref range; or a pull request. Resolve refs, merge bases, and changed files precisely. For a single commit, simplify the change introduced by that commit (`<commit>^..<commit>`) unless the user asks for its full snapshot. For a pull request, resolve its base and head. Do not check out another ref or otherwise disturb the worktree.
- **Specific scope:** If the user names a feature, module, section, file, directory, package, or similar boundary, review that scope and the surrounding code needed to understand it. Combine this boundary with a change target when both are given.
- **Entire repository:** Only use repository-wide scope when explicitly requested. Explore the repository first, identify a small ranked list of concrete, high-confidence simplification candidates, and work through only the best bounded candidates. Do not turn a repository-wide request into an unbounded rewrite.

Treat code outside the resolved scope as context. Inspect interfaces, callers, dependencies, and tests as needed, but do not silently expand the work. If the target is omitted and no changes from the current task can be identified, or if the target is materially ambiguous, ask one concise clarifying question.

## Review

Inspect the relevant diff, implementation, callers, tests, and established local patterns. Look for:

- code that can be deleted;
- existing code that should be reused;
- unnecessary abstractions or indirection;
- duplicated logic or state;
- overly complex control flow;
- speculative flexibility or configuration;
- local workarounds that should be replaced by a simpler underlying design;
- names, types, and structure that make the code harder to understand;
- implementation patterns inconsistent with the surrounding codebase.

Prefer, in order:

> delete > reuse > inline > consolidate > abstract

Optimize for the smallest number of concepts a future developer or coding agent needs to understand, not the smallest number of lines.

Do not introduce a new abstraction unless it makes the resulting code materially easier to understand. Do not merely move complexity, hide it behind a helper, or trade clear duplication for premature generalization.

## Apply

Make the simplifications directly unless the user asks for an audit or recommendations only.

Keep edits within the resolved scope. Changes immediately outside it are allowed only when required to complete the simplification safely, such as updating a caller after removing an unnecessary interface; keep these changes minimal and explain them.

Preserve public behavior, compatibility, error handling, and observable side effects. Preserve intentional tests; update tests only when their structure must change without changing what they verify.

For repository-wide work, present the short candidate list before editing when user input is available. Otherwise, select only a few high-confidence, low-risk candidates with clear verification paths.

## Verify

Review the final diff to ensure it is simpler and contains no unrelated changes. Run the relevant focused checks, then broader checks when practical. Report:

- what was simplified;
- the scope used;
- verification performed;
- anything not verified or any candidate deliberately left untouched.
