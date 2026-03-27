---
name: eliniscan:update
description: Check for updates and install latest version
allowed-tools:
  - Bash
  - AskUserQuestion
---
<objective>
Check if a newer version of eliniscan is available on npm, show changelog, and update if user confirms.
</objective>

<process>
1. Get installed version: `npm list -g eliniscan --json 2>/dev/null | node -e "..."`
2. Get latest version: `npm view eliniscan version`
3. Compare — if same, say "Already up to date"
4. If newer:
   - Fetch changelog from GitHub
   - Display what changed
   - Ask user to confirm
   - Run `npm install -g eliniscan@latest`
   - Clear cache: `rm -rf ~/.claude/eliniscan/cache`
   - Say "Updated! Restart Claude Code to use new version."
</process>
