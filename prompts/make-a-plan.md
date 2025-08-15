# LLM Agent Task Iteration Rules

## Initial Setup

1. **Create `plan.md`** - Start every project with a markdown file containing:
    - Project goals as checkboxes `- [ ] Task description`
    - File references section for key files to track
    - Status tracking for completed tasks

2. **Plan Review** - Present the complete plan for approval before execution

## Execution Workflow

1. **Task Completion** - For each completed task:
    - Mark as done: `- [x] Task description`
    - Update `plan.md` immediately
    - Note any files created/modified

2. **Change Management** - Before making significant changes:
    - Document the proposed change
    - Explain impact on existing plan
    - Wait for approval if change affects project scope

3. **File Maintenance** - After each modification:
    - Format code/files appropriately
    - Run diagnostics/validation
    - Fix any errors before proceeding

## Continuous Tracking

- **File Registry** - Maintain list of relevant files in `plan.md`
- **Progress Updates** - Update plan status after each task
- **Context Preservation** - Document decisions and changes for future reference

## Validation Rules

- Complete current task fully before starting next
- Verify all diagnostics pass
- Ensure plan reflects current project state
- Confirm all referenced files are accessible
