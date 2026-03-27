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

CRITICAL: Before doing ANYTHING, you MUST ask the setup questions below. Do NOT start scanning until all questions are answered. Do NOT assume defaults — ASK the user.
</objective>

<execution_context>
@$HOME/.claude/eliniscan/workflows/scan.md
</execution_context>

<process>
## STEP 1: MANDATORY SETUP QUESTIONS (ask ALL of these BEFORE scanning)

You MUST use AskUserQuestion or direct questions to get answers for ALL of these. Do NOT skip any. Do NOT assume defaults. Wait for user answers.

Display this header first:
```
═══════════════════════════════════════════════════
  eliniscan — Full Codebase Scanner
═══════════════════════════════════════════════════
```

Then ask these questions ONE BY ONE:

**Question 1 — Scan Depth:**
```
Scan depth?
  1. Full  — Read every line of every file (thorough, slower)
  2. Quick — Focus on critical patterns only (faster)
```

**Question 2 — AI Model:**
```
Which model should scan your files?
  1. Opus   — Most thorough, catches subtle issues (slower)
  2. Sonnet — Balanced speed and quality (recommended)
  3. Haiku  — Fastest, may miss subtle issues
```

**Question 3 — File Types:**
```
Which file extensions to scan? (comma-separated)
  Default: ts,tsx,js,jsx,css
  Enter custom or press enter for default:
```

**Question 4 — Exclude Directories:**
```
Directories to exclude? (comma-separated)
  Default: node_modules,.next,dist,build,.git
  Enter additional or press enter for default:
```

**Question 5 — Severity Filter:**
```
Minimum severity to report?
  1. All      — Report everything (CRITICAL → INFO)
  2. High     — Only CRITICAL and HIGH
  3. Critical — Only CRITICAL
```

After ALL questions are answered, display a summary:
```
  Scan Config:
  ─────────────────────────────
  Depth:      {depth}
  Model:      {model}
  File types: {types}
  Exclude:    {dirs}
  Severity:   {severity}

  Starting scan...
```

## STEP 2: Only AFTER setup is confirmed, follow the scan workflow

@$HOME/.claude/eliniscan/workflows/scan.md

## STEP 3: After scan completes, display:

```
✓ Scan complete: {X} files scanned, {Y} issues found

  CRITICAL: {n}  |  HIGH: {n}  |  MEDIUM: {n}  |  LOW: {n}

  Reports:
  - ELINISCAN-FINDINGS.md (detailed findings)
  - ELINISCAN-TRACKING.md (file-by-file status)

  Next: Run /eliniscan:fix to auto-fix issues
        Run /eliniscan:report for a summary report
```
</process>
