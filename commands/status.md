---
name: eliniscan:status
description: Show current scan/fix progress and state
allowed-tools:
  - Bash
  - Read
---
<objective>
Show the current state of eliniscan — is a scan running? fix in progress? what's the progress?
</objective>

<process>
Run:
```bash
node ~/.claude/eliniscan/bin/eliniscan-tools.cjs progress
```

Parse the JSON output and display:

```markdown
## eliniscan Status

| Field | Value |
|-------|-------|
| Status | {scanning/fixing/idle/complete} |
| Phase | {scan/fix/verify/build} |
| Progress | {current}/{total} |
| Model | {opus/sonnet/haiku} |
| Findings | {count} |

{If running: "Scan/Fix in progress..."}
{If idle: "No active operation. Run /eliniscan:scan to start."}
{If complete: "Last scan complete. Run /eliniscan:report for summary."}
```
</process>
