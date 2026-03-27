---
name: eliniscan:fix
description: Auto-fix all issues found by scan — batched 500 per session, then verify, then build check
argument-hint: "[--severity critical|high|medium|all] [--batch-size 500] [--skip-verify] [--skip-build]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---
<objective>
Fix all issues from ELINISCAN-FINDINGS.md. Works in 3 phases:

Phase 1 — FIX: Batch findings (500 per session), fix each file
Phase 2 — VERIFY: Re-scan fixed files, fix any new issues
Phase 3 — BUILD: Run build check, report results
</objective>

<execution_context>
@$HOME/.claude/eliniscan/workflows/fix.md
</execution_context>

<context>
Arguments: $ARGUMENTS

## Flow
1. Read ELINISCAN-FINDINGS.md
2. Group findings by file
3. For each file: send file + its findings to Claude, get fixed version back
4. Write fixed file (no intermediate checks — batch all fixes)
5. After all files: run verify scan on changed files
6. If verify finds new issues: fix those too
7. Final build check: `tsc --noEmit` + `npm run build`
8. Report results

## Safety Rules
- Never change import/export signatures
- Never add new dependencies
- If a fix would break behavior, skip it
- Track everything in FIX-TRACKING.md

## After Completion
Display:
```
✓ Fix complete

  Fixed: {X} files  |  Skipped: {Y}  |  New issues from verify: {Z}
  Build: {PASS/FAIL}

  Next: Run /eliniscan:report for full summary
        Run /eliniscan:scan to re-scan from scratch
```
</context>
