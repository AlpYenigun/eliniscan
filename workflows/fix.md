# eliniscan Fix Workflow

## Phase 1: Batch Fix

1. Read `ELINISCAN-FINDINGS.md`
2. Group findings by file
3. For each file with findings:
   - Read current file content
   - Extract that file's findings from ELINISCAN-FINDINGS.md
   - Send to Claude with fix prompt
   - Validate output (is it code?)
   - Write the fixed file
   - Log to `FIX-TRACKING.md`

### Fix Prompt Template

```
You are a code fixer. Fix ALL issues listed below. Return the COMPLETE fixed file.

RULES:
1. ONLY fix the reported issues — change nothing else
2. Do NOT change import/export signatures (breaking change)
3. Do NOT add new dependencies
4. Do NOT add module-level throw statements — they crash Next.js build
5. Do NOT wrap entire files in try/catch
6. For missing env vars: use fallback values or runtime checks, NOT build-time throws
7. Return ONLY code — no explanations, no markdown fences, no comments about fixes
8. If a fix would break existing behavior, SKIP that fix
9. Return the ENTIRE file, not just changed parts

DANGEROUS PATTERNS TO AVOID:
- throw new Error() at module level (outside functions) — crashes build
- process.exit() — kills the process
- Removing existing exports — breaks other files
- Changing function parameter types — breaks callers

SAFE FIX PATTERNS:
- Add try/catch inside functions (NOT at module level)
- Add await to async calls
- Add null checks with ?.
- Replace empty catch with console.error
- Add input validation inside request handlers
- Add rate limiting middleware

ISSUES:
{findings}

FILE ({path}):
{content}
```

### Output Validation

After receiving Claude's response, check BEFORE writing to disk:

```bash
# Strip markdown fences
if head -1 "$TEMP_FIX" | grep -q '^\`\`\`'; then
  sed -i '' '1d' "$TEMP_FIX"
  if tail -1 "$TEMP_FIX" | grep -q '^\`\`\`'; then
    sed -i '' '$d' "$TEMP_FIX"
  fi
fi

# Validate: first line must look like code
FIRST_LINE=$(head -1 "$TEMP_FIX")
if ! echo "$FIRST_LINE" | grep -qE '^(import |"use |export |//|/\*|const |let |var |function |class |interface |type |enum |\{|#|$)'; then
  echo "REJECTED: output is not code"
  # Do NOT write to file
fi

# Check for dangerous patterns
if grep -q 'throw new Error' "$TEMP_FIX" | head -5 | grep -v 'function\|=>\|catch\|if\|else'; then
  echo "WARNING: module-level throw detected"
fi
```

## Phase 2: Verify Scan (automatic after Phase 1)

Re-scan ONLY the files that were fixed. Use the same `claude --print` approach but with a verify-specific prompt:

```
This file was just auto-fixed. Check for NEW issues introduced by the fix.
Do NOT re-report the original issues — only NEW problems.
Check specifically for:
- Syntax errors from bad fix
- Missing imports from changed code
- Module-level throw statements (build crash)
- Broken logic from incorrect fix
- Removed functionality

If clean: CLEAN
If new issues found: report them.

FILE ({path}):
{content}
```

If verify finds new issues → fix those too (one more pass only).

## Phase 3: Build Check

```bash
echo "=== TypeScript Check ==="
TSC_BEFORE=$(npx tsc --noEmit --pretty false 2>&1 | wc -l | tr -d ' ')

echo "=== Build ==="
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?

if [[ "$BUILD_EXIT" -eq 0 ]]; then
  echo "BUILD PASSED"
else
  echo "BUILD FAILED"
  # Show which files caused errors
  echo "$BUILD_OUTPUT" | grep -E 'Error|error' | head -10
fi
```

## Completion Message

```markdown
## eliniscan Fix Complete

| Metric | Value |
|--------|-------|
| Files fixed | {X} |
| Files skipped | {Y} |
| Verify issues | {Z} |
| Build | {PASS/FAIL} |
| TSC errors | {before} → {after} |

### Next Steps
- `/eliniscan:scan` — full re-scan to verify all fixes
- `/eliniscan:report` — view complete summary
```
