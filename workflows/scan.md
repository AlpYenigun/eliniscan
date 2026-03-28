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

## Step 3: Gather Project Context

Before scanning, collect env var names so scanner knows what's in .env:

```bash
# Collect env var names (NOT values) for context
ENV_CONTEXT=""
for envfile in .env .env.local .env.production; do
  if [[ -f "$envfile" ]]; then
    VARS=$(grep -v '^#' "$envfile" | grep '=' | cut -d'=' -f1 | sort | tr '\n' ', ')
    ENV_CONTEXT="${ENV_CONTEXT}${envfile}: ${VARS}\n"
  fi
done
```

This is passed to the scan prompt so it knows which secrets are in .env vs hardcoded.

## Step 4: Initialize Reports

Create `ELINISCAN-FINDINGS.md` and `ELINISCAN-TRACKING.md` using Write tool.

## Step 5: Generate and Run Scan Script

CRITICAL: The scan script MUST run in the BACKGROUND using `nohup ... &` because each `claude --print` call takes 30-60 seconds per file.

Generate the script to `/tmp/eliniscan_run.sh`, then run with `nohup bash /tmp/eliniscan_run.sh > /tmp/eliniscan_scan.log 2>&1 &`.

The script template (replace {MODEL} with user's choice, {ENV_CONTEXT} with collected env vars):

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

  PROMPT="You are a strict code auditor. Read EVERY LINE of the file below.

FIND ONLY REAL, ACTIONABLE ISSUES:
1. SECURITY: XSS, injection, auth bypass, token leak, IDOR, hardcoded secrets, SSRF
2. BUGS: null/undefined crash, wrong logic, race condition, unhandled error, wrong field
3. PERFORMANCE: N+1 query, memory leak, missing pagination, blocking I/O
4. ERROR HANDLING: empty catch blocks, unhandled promise rejection
5. CODE QUALITY: duplicate code, dead code, any type abuse

STRICT RULES — follow these EXACTLY:
- Report ONLY issues that would cause bugs, security holes, or crashes
- Do NOT report style preferences, naming conventions, or minor suggestions
- Do NOT report missing comments or documentation
- Do NOT flag env vars that exist in .env files (see ENV CONTEXT below)
- Do NOT report theoretical issues that require unlikely conditions
- If the code works correctly and safely: write CLEAN
- Each finding must have a SPECIFIC line number
- SEVERITY must be justified — CRITICAL means exploitable NOW, not theoretically

ENV CONTEXT (variables defined in .env files — NOT hardcoded):
{ENV_CONTEXT}

OUTPUT FORMAT:
If no real issues: CLEAN
For each issue:

#ID [SEVERITY] Short title
- File: \`$REL_PATH:LINE_NO\`
- Description: What and why it is a problem

Replace #ID with sequential number starting from $((FINDING_ID + 1)).
Severity: CRITICAL, HIGH, MEDIUM, LOW, INFO.

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

Replace `{MODEL}` with user's chosen model, `{ENV_CONTEXT}` with collected env var names.

## Step 6: Monitor Progress

After starting the background script, poll progress every 30 seconds:

```bash
cat /tmp/eliniscan_progress.txt 2>/dev/null && tail -3 /tmp/eliniscan_scan.log 2>/dev/null
```

When progress file contains "DONE", scan is complete.

## Step 7: Completion

Read ELINISCAN-FINDINGS.md, count findings, display as markdown table.
