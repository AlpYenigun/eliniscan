---
name: eliniscan:scan
description: Full codebase scan — opens a separate Claude session for every file, reads every line, reports all issues
argument-hint: "[--depth full|quick] [--model opus|sonnet|haiku] [--severity all|critical|high]"
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
Scan the entire codebase file by file. Each file gets its own fresh Claude session via `claude --print` — no context limits, no skipped lines.

This is the core of eliniscan: the reason it finds bugs other tools miss is that every file gets 100% of the context window dedicated to just that file.
</objective>

<execution_context>
@$HOME/.claude/eliniscan/workflows/scan.md
</execution_context>

<context>
Arguments: $ARGUMENTS

## How It Works
1. Ask setup questions (or use defaults from args)
2. List all source files in the project
3. For each file, spawn a `claude --print` session with the scan prompt
4. Collect findings into `ELINISCAN-FINDINGS.md` (numbered #001, #002...)
5. Track progress in `ELINISCAN-TRACKING.md`
6. When done, display summary and suggest next command

## After Completion
Display:
```
✓ Scan complete: {X} files scanned, {Y} issues found

  CRITICAL: {n}  |  HIGH: {n}  |  MEDIUM: {n}  |  LOW: {n}

  Reports:
  - ELINISCAN-FINDINGS.md (detailed findings)
  - ELINISCAN-TRACKING.md (file-by-file status)

  Next: Run /eliniscan:fix to auto-fix issues
        Run /eliniscan:report for a summary report
```
</context>
