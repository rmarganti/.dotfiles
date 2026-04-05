---
name: obsidian-notes
description: Manage Obsidian markdown notes — add new information, update existing notes, and continuously improve vault organization (links, tags, index files). Use when the user wants to remember something, update their notes, improve their knowledge base, or organize their vault.
---

# Obsidian Notes

Manage personal and work knowledge vaults using pure GitHub-flavored markdown. Obsidian does not need to be open.

## Vault Discovery

Always start by reading the config:

```bash
cat ~/.config/ide-common.json
```

The `obsidian.workspaces` array lists available vaults with `name` and `path`. Expand `~` manually when constructing file paths for tools.

## Vault Selection

Infer the appropriate vault from the content context:

- Work projects, colleagues, technical systems, job-related tools → `work` vault
- Personal interests, hobbies, general learning → `personal` vault
- If ambiguous → use the first workspace in the array

Never ask the user which vault unless there is genuine, irresolvable ambiguity.

## Vault Introspection Tools

All vault operations use standard file tools — Obsidian does not need to be open.

```bash
# Full-text search
rg "<term>" "<vault-path>" --glob="*.md" -l

# Find all notes
fd --extension md . "<vault-path>"

# List all tags sorted by usage (run before tagging any note)
python3 ~/.agents/skills/obsidian-notes/scripts/vault-tags.py "<vault-path>"

# Find notes that link to a given file (backlinks)
rg "<filename>" "<vault-path>" --glob="*.md" -l
```

See [workflows.md](references/workflows.md) for full usage in context.

## Core Principles

- **GitHub-flavored markdown only** — no `[[wikilinks]]`, no Obsidian-specific syntax
- **Standard relative links**: `[label](../relative/path.md)`
- **Search non-diary notes first** and prefer focused notes over catch-all files
- **Every file write triggers an improvement pass** — links, tags, and index.md
- **Ask before splitting** catch-all notes; create focused new files for new content going forward
- **One topic per file** — enforce going forward, not retroactively without permission
- **Avoid duplicating sensitive content** (credentials, secrets, tokens, internal values); prefer summarizing and linking instead of copying

## Reference

| Topic                                                 | File                                        |
| ----------------------------------------------------- | ------------------------------------------- |
| Frontmatter, filenames, folder structure, links, tags | [conventions.md](references/conventions.md) |
| Add note, improvement pass, vault search              | [workflows.md](references/workflows.md)     |
