# eliniscan Scan Workflow

## Step 1: Setup Questions

The command file handles setup questions. By the time this workflow runs, you have:
- `depth`: full or quick
- `model`: opus, sonnet, or haiku
- `fileTypes`: comma-separated extensions
- `excludeDirs`: comma-separated dirs to skip
- `severity`: all, high, or critical

## Step 2: File Discovery

Build a find command from user's file types and exclusions. Write it to disk and run:

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" ! -path "*/.git/*" \
  | sort > /tmp/eliniscan_files.txt

TOTAL=$(wc -l < /tmp/eliniscan_files.txt | tr -d ' ')
echo "$TOTAL files to scan"
```

Adapt the find command based on user's chosen file types and exclude dirs.

## Step 3: Initialize Reports

Create `ELINISCAN-FINDINGS.md` and `ELINISCAN-TRACKING.md` using Write tool.

## Step 4: Generate and Run Scan Script

CRITICAL: The scan script MUST run in the BACKGROUND using `run_in_background: true` on the Bash tool, because each `claude --print` call takes 30-60 seconds per file. Running foreground will timeout.

Generate the script to `/tmp/eliniscan_run.sh`, then run it with `run_in_background: true`.

The script template (replace {MODEL} with user's choice, adapt find patterns):

```bash
#!/bin/bash
set -uo pipefail

PROJECT_DIR="$(pwd)"
FINDINGS="$PROJECT_DIR/ELINISCAN-FINDINGS.md"
PROGRESS="/tmp/eliniscan_progress.txt"
LOG="/tmp/eliniscan_scan.log"
FINDING_ID=0
TOTAL=$(wc -l < /tmp/eliniscan_files.txt | tr -d ' ')
CURRENT=0

echo "eliniscan scan started: $TOTAL files" > "$LOG"

while IFS= read -r FILEPATH; do
  CURRENT=$((CURRENT + 1))
  REL_PATH="${FILEPATH#./}"
  LINE_COUNT=$(wc -l < "$FILEPATH" | tr -d ' ')
  PCT=$((CURRENT * 100 / TOTAL))

  echo "[$CURRENT/$TOTAL] ($PCT%) $REL_PATH ($LINE_COUNT lines)" >> "$LOG"

  PROMPT="You are a code auditor. Read EVERY LINE of the file below and find:

1. SECURITY: XSS, injection, auth bypass, token leak, IDOR, hardcoded secrets
2. BUGS: null/undefined crash, wrong logic, race condition, unhandled error
3. PERFORMANCE: unnecessary re-render, N+1 query, memory leak, missing memoization
4. ERROR HANDLING: empty catch, silent error swallowing, missing error boundary
5. CODE QUALITY: duplicate code, hardcoded values, inconsistent patterns, any type

RULES:
- Read every line. Do NOT skip anything.
- If no issues: write only CLEAN
- For each issue use this format:

#ID [SEVERITY] Short title
- File: ${REL_PATH}:LINE_NO
- Description: What and why it is a problem

Replace #ID with sequential number starting from $((FINDING_ID + 1)).
Severity: CRITICAL, HIGH, MEDIUM, LOW, INFO.
Only report real issues. Do NOT repeat the file content.

--- FILE: $REL_PATH ($LINE_COUNT lines) ---

$(cat "$FILEPATH")"

  RESULT=$(echo "$PROMPT" | claude --print --model {MODEL} -p - 2>/dev/null)

  FILE_FINDINGS=$(echo "$RESULT" | grep -c '^#[0-9]' || echo "0")
  FILE_FINDINGS=$(echo "$FILE_FINDINGS" | tr -cd '0-9')
  FILE_FINDINGS=${FILE_FINDINGS:-0}

  if [[ "$FILE_FINDINGS" -gt 0 ]]; then
    FINDING_ID=$((FINDING_ID + FILE_FINDINGS))
    printf "\n### %s\n\n%s\n\n---\n" "$REL_PATH" "$RESULT" >> "$FINDINGS"
    echo "  found $FILE_FINDINGS issues" >> "$LOG"
  else
    echo "  CLEAN" >> "$LOG"
  fi

  echo "$CURRENT/$TOTAL" > "$PROGRESS"
  sleep 2
done < /tmp/eliniscan_files.txt

echo "" >> "$LOG"
echo "SCAN COMPLETE: $TOTAL files, $FINDING_ID issues" >> "$LOG"
echo "DONE" > "$PROGRESS"
```

## Step 5: Monitor Progress

After starting the background script, poll progress periodically:

```bash
cat /tmp/eliniscan_progress.txt 2>/dev/null
tail -5 /tmp/eliniscan_scan.log 2>/dev/null
```

Check every 30-60 seconds. Display progress to user:

```
Scanning... 14/24 (58%)
  Last: src/components/Button.tsx — 3 issues
```

When `/tmp/eliniscan_progress.txt` contains "DONE", the scan is complete.

## Step 6: Completion

Read the final log, count findings, display:

```
✓ Scan complete: {X} files scanned, {Y} issues found

  CRITICAL: {n}  |  HIGH: {n}  |  MEDIUM: {n}  |  LOW: {n}

  Reports:
  - ELINISCAN-FINDINGS.md (detailed findings)
  - ELINISCAN-TRACKING.md (file-by-file status)

  Next: Run /eliniscan:fix to auto-fix issues
        Run /eliniscan:report for a summary report
```
