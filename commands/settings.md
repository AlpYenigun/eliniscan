---
name: eliniscan:settings
description: View and modify eliniscan configuration
allowed-tools:
  - Bash
  - AskUserQuestion
---
<objective>
Show current config and let user modify defaults.
</objective>

<process>
1. Show current config:
```bash
node ~/.claude/eliniscan/bin/eliniscan-tools.cjs config get
```

2. Display as table:
```markdown
## eliniscan Settings

| Setting | Value |
|---------|-------|
| Default model | {sonnet} |
| Default depth | {full} |
| Default severity | {all} |
| File types | {ts,tsx,js,jsx,css} |
| Exclude dirs | {node_modules,.next,dist,build,.git} |
| Scan sleep (ms) | {2000} |
| Fix sleep (ms) | {2000} |
| Auto verify | {true} |
| Auto build | {true} |
| Runtime | {claude} |

To change: `/eliniscan:settings set <key> <value>`
```

3. If user provides a setting to change:
```bash
node ~/.claude/eliniscan/bin/eliniscan-tools.cjs config set {key} {value}
```
</process>
