# eliniscan Fix Workflow

## Phase 1: Batch Fix

1. Read `ELINISCAN-FINDINGS.md`
2. Group findings by file
3. For each file with findings:
   - Read current file content
   - Extract that file's findings from ELINISCAN-FINDINGS.md
   - Send to Claude with fix prompt
   - Write the fixed file directly (NO intermediate check)
   - Log to `FIX-TRACKING.md`

### Fix Prompt Template

```
You are a code fixer. Below is a file and the issues found in it.

TASK: Fix ALL issues. Return the COMPLETE fixed file.

RULES:
1. ONLY fix the reported issues — change nothing else
2. Do NOT change import/export signatures
3. Do NOT add new dependencies
4. Return ONLY code — no explanations, no markdown fences
5. If a fix would break behavior, SKIP that fix
6. Return the ENTIRE file, not just changed parts

ISSUES:
{findings}

FILE ({path}):
{content}
```

### Validation — Code fence detection

After receiving Claude's response, check:
- If first line starts with ``` — remove first and last lines
- If first line contains non-code text (Turkish/English explanation) — SKIP this file, log as FAILED
- Quick check: first line should start with `import`, `"use`, `export`, `//`, `/*`, `const`, `let`, `var`, `function`, `class`, `interface`, `type`, `enum`, `{`, or be empty

## Phase 2: Verify Scan

1. Get list of fixed files from FIX-TRACKING.md
2. For each fixed file, run a mini-scan (same as main scan but only on changed files)
3. If new issues found → fix them (one more pass)

### Verify prompt:
```
This file was just fixed. Check if the fixes introduced any NEW issues.
If clean, write CLEAN. If new issues, report them.

FILE ({path}):
{content}
```

## Phase 3: Build Check

```bash
echo "=== TypeScript Check ==="
npx tsc --noEmit --pretty false 2>&1 | tail -20

echo "=== Build ==="
npm run build 2>&1 | tail -20
```

Report results. If build fails, identify which files caused it.

## Completion Message

```
✓ eliniscan fix complete

  Phase 1 (Fix):    {X} files fixed, {Y} skipped
  Phase 2 (Verify): {Z} new issues found and fixed
  Phase 3 (Build):  {PASS/FAIL}

  Next: /eliniscan:scan    — full re-scan to verify
        /eliniscan:report  — view summary
```
