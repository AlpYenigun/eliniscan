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

## STEP 2: Generate and launch scan script

After setup, you MUST:

1. Discover files using `find` command (adapt extensions and excludes from user's answers)
2. Create ELINISCAN-FINDINGS.md and ELINISCAN-TRACKING.md
3. Write the scan script to `/tmp/eliniscan_run.sh` following the workflow at @$HOME/.claude/eliniscan/workflows/scan.md
4. Launch it with: `nohup bash /tmp/eliniscan_run.sh > /tmp/eliniscan_scan.log 2>&1 &`

**CRITICAL**: You MUST use `nohup ... &` to run the script in background. Do NOT run it in foreground — it will timeout. Do NOT use `run_in_background` parameter on Bash tool — use `nohup` directly in the command string.

5. After launching, poll progress every 30 seconds:
```bash
cat /tmp/eliniscan_progress.txt 2>/dev/null && tail -3 /tmp/eliniscan_scan.log 2>/dev/null
```

6. When progress file contains "DONE", scan is complete.

## STEP 3: After scan completes, read ELINISCAN-FINDINGS.md and display results as a MARKDOWN TABLE:

Count severities by grepping `**[CRITICAL]`, `**[HIGH]`, etc. from ELINISCAN-FINDINGS.md. Then display:

```markdown
## eliniscan Scan Complete

| Metric | Value |
|--------|-------|
| Files scanned | {X} |
| Clean files | {Y} |
| Total issues | {Z} |

### Severity Breakdown

| Severity | Count |
|----------|-------|
| CRITICAL | {n} |
| HIGH | {n} |
| MEDIUM | {n} |
| LOW | {n} |
| INFO | {n} |
| **Total** | **{sum}** |

### Top Offenders (most issues)

| File | Issues |
|------|--------|
| {file1} | {n} |
| {file2} | {n} |
| ... | ... |

### Reports
- `ELINISCAN-FINDINGS.md` — detailed findings with line numbers
- `ELINISCAN-TRACKING.md` — file-by-file scan status

### Next Steps
- `/eliniscan:fix` — auto-fix all issues
- `/eliniscan:report` — detailed summary report
```

Use ACTUAL numbers from the findings file. Do NOT hardcode. Count with grep.
</process>
