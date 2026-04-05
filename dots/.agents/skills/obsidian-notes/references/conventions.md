# Note Conventions

## Frontmatter

Every note requires frontmatter. Minimum viable:

```yaml
---
tags: []
---
```

Full example:

```yaml
---
tags: [typescript, api-design]
aliases: [Human Readable Name]
---
```

- `tags` — always present, even if empty; check existing vault tags before inventing new ones
- `aliases` — optional; use when the filename differs meaningfully from how you'd naturally reference the topic

## Filenames

- **kebab-case**: `api-design-patterns.md`, `postgres-cheatsheet.md`
- Lowercase, no spaces, no special characters
- Descriptive but concise — prefer `git-rebase.md` over `notes-about-git-rebase-onto.md`

## Folder Structure

Group notes by domain, not by type:

```
work/
├── index.md
├── projects/
│   ├── index.md
│   └── adapt/
│       ├── index.md
│       └── adapt.md
├── programming-notes/
│   ├── index.md
│   ├── typescript.md
│   └── postgres.md
└── cheatsheets/
    ├── index.md
    └── git.md
```

- New content goes into the most specific matching folder
- Create a new folder when 2+ notes share a topic with no existing home
- Prefer depth over accumulating unrelated content in root or catch-all files

## index.md Files

`index.md` files are recommended for stable topic folders and the vault root. Required format when present:

```markdown
---
tags: [index]
---

# Folder Name

Brief description of what lives in this folder.

## Contents

- [Note Title](note-file.md) — one-line description
- [Another Note](other-file.md) — one-line description

## Subfolders

- [Subfolder](subfolder/index.md) — brief description
```

- Update whenever a note is added to or removed from the folder
- The root `index.md` is the vault's table of contents — keep it current
- Do not force-create folder indexes immediately; add them as folders become important or gain multiple related notes

## Sensitive content

- Avoid duplicating credentials, secrets, tokens, passwords, or private keys into new notes
- Prefer summarizing sensitive material and linking to the canonical note containing it
- If a note already contains sensitive content, minimize further spread during reorganization

## Links

Use standard relative markdown links only:

```markdown
[Postgres Cheatsheet](../cheatsheets/postgres.md)
[Adapt Project](../projects/adapt/adapt.md)
```

- Always relative paths, never absolute
- Link when you mention a concept that has its own dedicated note
- Prefer linking at first mention in a note, not every occurrence

## Tags

- Lowercase, hyphenated: `api-design`, `work-in-progress`
- Created organically based on content — but always check existing tags first
- Prefer reusing an existing tag over creating a near-duplicate
- Remove overly generic tags that add no value (e.g. `stuff`, `misc`)

Common patterns:

- **Topic**: `typescript`, `postgres`, `fastly`, `terraform`
- **Domain**: `work`, `personal`, `infrastructure`, `frontend`
- **Type**: `cheatsheet`, `reference`, `wip`, `index`
