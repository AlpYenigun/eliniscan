---
name: eliniscan:fix
description: Auto-fix all issues found by scan — background script, then verify, then build check
argument-hint: "[--severity critical|high|medium|all] [--model opus|sonnet]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---
<objective>
Fix all issues from ELINISCAN-FINDINGS.md using a background script. Each file gets its own Claude session — same approach as scan.

CRITICAL: Do NOT fix files yourself. Generate a bash script and run it in background with `nohup`.
</objective>

<process>
## STEP 1: Pre-check

1. Verify ELINISCAN-FINDINGS.md exists. If not, tell user to run `/eliniscan:scan` first.
2. Count findings and files with issues.
3. Ask user:

```
eliniscan Fix

Found {X} issues in {Y} files.

Which model for fixing?
  1. Opus   — Most accurate fixes (slower)
  2. Sonnet — Fast and reliable (recommended)

Severity filter?
  1. All      — Fix everything
  2. High     — Only CRITICAL and HIGH
  3. Critical — Only CRITICAL
```

## STEP 2: Generate extract-findings.py helper

Write this Python helper to `/tmp/eliniscan_extract.py`:

```python
#!/usr/bin/env python3
import sys, re

def extract(findings_path, target_file):
    with open(findings_path, 'r') as f:
        content = f.read()
    blocks = re.split(r'^### ', content, flags=re.MULTILINE)
    for block in blocks[1:]:
        lines = block.strip().split('\n')
        filepath = lines[0].strip()
        if filepath != target_file:
            continue
        body = '\n'.join(lines[1:]).strip()
        if body and body != 'CLEAN':
            print(body)
        return

if __name__ == '__main__':
    extract(sys.argv[1], sys.argv[2])
```

## STEP 3: Generate and launch fix script

Write to `/tmp/eliniscan_fix.sh`:

```bash
#!/bin/bash
set -uo pipefail

PROJECT_DIR="$(pwd)"
FINDINGS="$PROJECT_DIR/ELINISCAN-FINDINGS.md"
FIX_TRACKING="$PROJECT_DIR/FIX-TRACKING.md"
EXTRACT_PY="/tmp/eliniscan_extract.py"
PROGRESS="/tmp/eliniscan_fix_progress.txt"
LOG="/tmp/eliniscan_fix.log"
TEMP_FIX="/tmp/eliniscan_fix_result.txt"

# Get files with findings
FILE_LIST="/tmp/eliniscan_fix_files.txt"
grep '^### ' "$FINDINGS" | sed 's/### //' | sort -u > "$FILE_LIST"
TOTAL=$(wc -l < "$FILE_LIST" | tr -d ' ')

echo "eliniscan fix started: $TOTAL files" > "$LOG"

# Init tracking
cat > "$FIX_TRACKING" << 'HEADER'
# eliniscan Fix Tracking

| # | File | Status | Details | Date |
|---|------|--------|---------|------|
HEADER

FIXED=0
SKIPPED=0
CURRENT=0

while IFS= read -r REL_PATH; do
  CURRENT=$((CURRENT + 1))
  FILEPATH="$PROJECT_DIR/$REL_PATH"

  if [[ ! -f "$FILEPATH" ]]; then
    echo "[$CURRENT/$TOTAL] SKIP (missing): $REL_PATH" >> "$LOG"
    SKIPPED=$((SKIPPED + 1))
    echo "$CURRENT/$TOTAL" > "$PROGRESS"
    continue
  fi

  FILE_FINDINGS=$(python3 "$EXTRACT_PY" "$FINDINGS" "$REL_PATH" 2>/dev/null)

  if [[ -z "$FILE_FINDINGS" ]]; then
    echo "[$CURRENT/$TOTAL] SKIP (no findings): $REL_PATH" >> "$LOG"
    SKIPPED=$((SKIPPED + 1))
    echo "$CURRENT/$TOTAL" > "$PROGRESS"
    continue
  fi

  LINE_COUNT=$(wc -l < "$FILEPATH" | tr -d ' ')
  echo "[$CURRENT/$TOTAL] FIX: $REL_PATH ($LINE_COUNT lines)" >> "$LOG"

  PROMPT="You are a code fixer. Fix ALL issues listed below. Return the COMPLETE fixed file.

RULES:
1. ONLY fix the reported issues — change nothing else
2. Do NOT change import/export signatures
3. Do NOT add new dependencies
4. Return ONLY code — no explanations, no markdown fences
5. If a fix would break behavior, SKIP that fix
6. Return the ENTIRE file

ISSUES:
$FILE_FINDINGS

FILE ($REL_PATH):
$(cat "$FILEPATH")"

  if echo "$PROMPT" | claude --print --model {MODEL} -p - > "$TEMP_FIX" 2>/dev/null; then
    FIX_LINES=$(wc -l < "$TEMP_FIX" | tr -d ' ')

    if [[ "$FIX_LINES" -lt 3 ]]; then
      echo "  SKIP (empty result)" >> "$LOG"
      SKIPPED=$((SKIPPED + 1))
      echo "| $CURRENT | $REL_PATH | SKIPPED | empty result | $(date +%Y-%m-%d) |" >> "$FIX_TRACKING"
      echo "$CURRENT/$TOTAL" > "$PROGRESS"
      continue
    fi

    # Strip markdown fences if present
    if head -1 "$TEMP_FIX" | grep -q '^\`\`\`'; then
      sed -i '' '1d' "$TEMP_FIX"
      if tail -1 "$TEMP_FIX" | grep -q '^\`\`\`'; then
        sed -i '' '$d' "$TEMP_FIX"
      fi
    fi

    # Validate: first line should look like code
    FIRST_LINE=$(head -1 "$TEMP_FIX")
    if echo "$FIRST_LINE" | grep -qiE '^(import |"use |export |//|/\*|const |let |var |function |class |interface |type |enum |\{|$)'; then
      cp "$TEMP_FIX" "$FILEPATH"
      FIXED=$((FIXED + 1))
      echo "  FIXED" >> "$LOG"
      echo "| $CURRENT | $REL_PATH | FIXED | - | $(date +%Y-%m-%d) |" >> "$FIX_TRACKING"
    else
      echo "  SKIP (not code)" >> "$LOG"
      SKIPPED=$((SKIPPED + 1))
      echo "| $CURRENT | $REL_PATH | SKIPPED | output not code | $(date +%Y-%m-%d) |" >> "$FIX_TRACKING"
    fi
  else
    echo "  SKIP (claude error)" >> "$LOG"
    SKIPPED=$((SKIPPED + 1))
    echo "| $CURRENT | $REL_PATH | ERROR | claude failed | $(date +%Y-%m-%d) |" >> "$FIX_TRACKING"
  fi

  echo "$CURRENT/$TOTAL" > "$PROGRESS"
  sleep 2
done < "$FILE_LIST"

echo "" >> "$LOG"
echo "FIX COMPLETE: $FIXED fixed, $SKIPPED skipped" >> "$LOG"
echo "DONE" > "$PROGRESS"
```

Replace `{MODEL}` with user's choice.

**CRITICAL**: Launch with `nohup`:
```bash
nohup bash /tmp/eliniscan_fix.sh > /tmp/eliniscan_fix.log 2>&1 &
```

## STEP 4: Monitor progress

Poll every 30 seconds:
```bash
cat /tmp/eliniscan_fix_progress.txt 2>/dev/null && tail -3 /tmp/eliniscan_fix.log 2>/dev/null
```

When progress contains "DONE", fix is complete.

## STEP 5: After fix completes, display results as markdown table:

```markdown
## eliniscan Fix Complete

| Metric | Value |
|--------|-------|
| Files processed | {X} |
| Fixed | {Y} |
| Skipped | {Z} |

### Fix Tracking
See `FIX-TRACKING.md` for per-file details.

### Next Steps
- `/eliniscan:scan` — re-scan to verify fixes
- `/eliniscan:report` — view full summary
```
</process>
