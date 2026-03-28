---
name: eliniscan:clean
description: Remove all eliniscan-generated files from the project
allowed-tools:
  - Bash
  - AskUserQuestion
---
<objective>
Remove ELINISCAN-FINDINGS.md, ELINISCAN-TRACKING.md, FIX-TRACKING.md, and reset state.
</objective>

<process>
1. Ask user to confirm:
```
This will delete:
  - ELINISCAN-FINDINGS.md
  - ELINISCAN-TRACKING.md
  - FIX-TRACKING.md
  - State and progress files

Continue? (y/n)
```

2. If confirmed:
```bash
rm -f ELINISCAN-FINDINGS.md ELINISCAN-TRACKING.md FIX-TRACKING.md
rm -f /tmp/eliniscan_progress.txt /tmp/eliniscan_fix_progress.txt
rm -f /tmp/eliniscan_run.sh /tmp/eliniscan_fix.sh /tmp/eliniscan_extract.py
rm -f /tmp/eliniscan_scan.log /tmp/eliniscan_fix.log
node ~/.claude/eliniscan/bin/eliniscan-tools.cjs state reset
```

3. Display:
```
✓ eliniscan files cleaned. Run /eliniscan:scan to start fresh.
```
</process>
