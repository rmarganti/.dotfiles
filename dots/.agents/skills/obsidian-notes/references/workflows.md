# Workflows

## 1. Add Note

### Step 1: Discover vault

```bash
cat ~/.config/ide-common.json
```

Read the `obsidian.workspaces` array. Expand `~` in paths manually.

### Step 2: Select vault

Infer from content context. Fall back to first workspace if ambiguous.

### Step 3: Search for an existing home

```bash
rg "<key terms>" "<vault-path>" --glob="*.md" -l | grep -v '/diary/'
```

Rank candidates in this order:

1. Exact-topic focused note
2. Note in the relevant project/topic folder
3. Existing section in a catch-all note
4. No good match → create a new focused note

Create a new note when:

- search results are weak, noisy, or only tangentially related
- the best hit is a catch-all note and the topic is reusable/reference-worthy
- adding the content would create a new unrelated section in an existing note
- the topic is likely to accumulate more notes or examples over time

### Step 4a: Append to existing note

Use the `edit` tool to insert content in the appropriate section. Maintain the note's existing structure and heading hierarchy.

### Step 4b: Create a new file

1. Choose folder — find the most specific matching folder, or create one if 2+ notes will share the topic
2. Choose filename — kebab-case, descriptive, concise
3. Write with minimum frontmatter (`tags: []`) and a clear `# Title` heading
4. If the folder already has an `index.md`, add the new note to its Contents list
5. If the folder has no `index.md`, do not force one immediately — create or propose one when the folder becomes important or gains multiple related notes

### Step 5: Run improvement pass

Always run after any write. See **Improvement Pass** below.

---

## 2. Improvement Pass

Run after every file write. Work through each step in order.

### Step 1: Links

1. Identify key concepts, tools, or projects mentioned in the note
2. Search the vault for notes covering those concepts:
    ```bash
    rg "<concept>" "<vault-path>" --glob="*.md" -l | grep -v '/diary/'
    ```
3. Add `[label](relative/path.md)` links at the first mention of each matched concept
4. Check whether any other notes should now link back to this one:
    ```bash
    rg "<this note's filename or topic>" "<vault-path>" --glob="*.md" -l | grep -v '/diary/'
    ```

### Step 2: Tags

1. Get existing vault tags:
    ```bash
    python3 ~/.agents/skills/obsidian-notes/scripts/vault-tags.py "<vault-path>"
    ```
2. Review the note's current `tags` frontmatter
3. Add relevant tags — prefer existing ones, create new only when clearly warranted
4. Remove overly generic or redundant tags

### Step 3: index.md

1. If the note's folder already has an `index.md`, update it
2. If the note is new: add it to the Contents list with a one-line description
3. If the note's title or purpose changed: update its index entry accordingly
4. If the folder has no `index.md`, only propose creating one when the folder is becoming a stable topic area or has multiple related notes

### Catch-all note detection

If you notice a note covers multiple unrelated topics, flag it to the user before doing anything:

> "I noticed `notes.md` covers several distinct topics (project codes, IP addresses, Fastly config). Want me to split these into focused notes?"

**Never split without explicit confirmation.**

### Sensitive content caution

If a note contains credentials, tokens, private keys, passwords, or other sensitive internal values:

- avoid copying those values into new notes
- prefer adding a short summary in a destination note and linking back to the source note
- avoid broadening exposure by duplicating secrets across multiple files

---

## 3. Vault Search Reference

Use whenever you need to find existing content before writing.

| Goal                          | Command                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------ | ------------------ |
| Full-text search              | `rg "<term>" "<vault-path>" --glob="\*.md" -l                                  | grep -v '/diary/'` |
| List all tags (sorted by use) | `python3 ~/.agents/skills/obsidian-notes/scripts/vault-tags.py "<vault-path>"` |
| Find backlinks to a note      | `rg "<filename>" "<vault-path>" --glob="\*.md" -l                              | grep -v '/diary/'` |
| List all notes                | `fd --extension md . "<vault-path>"`                                           |
| List folder contents          | `ls "<vault-path>/<folder>/"`                                                  |
