# eliniscan Scan Workflow

## Step 1: Setup Questions

If arguments don't specify these, ask the user:

1. **Scan depth**: `full` (every line) or `quick` (critical patterns only)? Default: `full`
2. **Model**: `opus` (thorough), `sonnet` (balanced), `haiku` (fast)? Default: `sonnet`
3. **File types**: Which extensions to scan? Default: `ts,tsx,js,jsx,css`
4. **Exclude patterns**: Additional dirs to skip? Default: `node_modules,.next,dist,build,.git`
5. **Severity filter**: Report all or only high+critical? Default: `all`

## Step 2: File Discovery

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" ! -path "*/.git/*" \
  | sort > /tmp/eliniscan_files.txt

TOTAL=$(wc -l < /tmp/eliniscan_files.txt | tr -d ' ')
echo "$TOTAL files to scan"
```

## Step 3: Initialize Reports

Create `ELINISCAN-FINDINGS.md`:
```markdown
# eliniscan Findings

**Date:** {date}
**Files:** {total}
**Model:** {model}
**Depth:** {depth}

## Severity Levels
- **CRITICAL** — Security vulnerability, data loss, auth bypass
- **HIGH** — Serious bug, wrong logic, race condition
- **MEDIUM** — Performance, missing error handling, code duplication
- **LOW** — Code quality, naming, minor improvements
- **INFO** — Notes, suggestions

---

## Findings

```

Create `ELINISCAN-TRACKING.md` with all files listed as PENDING.

## Step 4: Scan Loop

Generate and run this script:

```bash
#!/bin/bash
FINDINGS="ELINISCAN-FINDINGS.md"
PROGRESS="/tmp/eliniscan_progress.txt"
FINDING_ID=0
TOTAL=$(wc -l < /tmp/eliniscan_files.txt | tr -d ' ')
CURRENT=0
START=$(date +%s)

while IFS= read -r FILEPATH; do
  CURRENT=$((CURRENT + 1))
  REL_PATH="${FILEPATH#./}"
  LINE_COUNT=$(wc -l < "$FILEPATH" | tr -d ' ')
  PCT=$((CURRENT * 100 / TOTAL))

  echo "[$CURRENT/$TOTAL] ($PCT%) $REL_PATH ($LINE_COUNT lines)"

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
- File: \`$REL_PATH:LINE_NO\`
- Description: What and why it's a problem

Replace #ID with sequential number starting from $((FINDING_ID + 1)).
Severity: CRITICAL, HIGH, MEDIUM, LOW, INFO.
Only report real issues. Do NOT repeat the file content.

--- FILE: $REL_PATH ($LINE_COUNT lines) ---

$(cat "$FILEPATH")"

  RESULT=$(echo "$PROMPT" | claude --print --model {MODEL} -p - 2>/dev/null)

  FILE_FINDINGS=$(echo "$RESULT" | grep -c '^#[0-9]' || echo "0")
  FILE_FINDINGS=${FILE_FINDINGS:-0}

  if [[ "$FILE_FINDINGS" -gt 0 ]]; then
    FINDING_ID=$((FINDING_ID + FILE_FINDINGS))
    printf "\n### %s\n\n%s\n\n---\n" "$REL_PATH" "$RESULT" >> "$FINDINGS"
    echo "  ⚠ $FILE_FINDINGS issues"
  else
    echo "  ✓ CLEAN"
  fi

  echo "$CURRENT" > "$PROGRESS"
  sleep 2
done < /tmp/eliniscan_files.txt

echo ""
echo "SCAN COMPLETE: $TOTAL files, $FINDING_ID issues"
```

Replace `{MODEL}` with user's chosen model.

## Step 5: Monitor & Report

While script runs, periodically update ELINISCAN-TRACKING.md.

When done, display the completion message with next command suggestions.
