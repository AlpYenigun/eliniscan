---
name: eliniscan:resume
description: Resume an interrupted scan or fix from where it left off
allowed-tools:
  - Bash
  - Read
  - Write
---
<objective>
If a scan or fix was interrupted (session closed, crash, etc.), resume from the last completed file.
</objective>

<process>
1. Check state:
```bash
node ~/.claude/eliniscan/bin/eliniscan-tools.cjs state get
```

2. Check progress files:
```bash
cat /tmp/eliniscan_progress.txt 2>/dev/null
cat /tmp/eliniscan_fix_progress.txt 2>/dev/null
```

3. If a scan was in progress:
   - Read the progress file to find last completed file number
   - Re-generate the scan script with the same settings but starting from that file number
   - Launch with nohup

4. If a fix was in progress:
   - Same approach — find last fixed file, resume from there

5. If nothing to resume:
   ```
   Nothing to resume. Run /eliniscan:scan to start a new scan.
   ```
</process>
