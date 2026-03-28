---
name: eliniscan:update
description: Check for updates and install latest version from GitHub
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
---
<objective>
Check GitHub for newer version of eliniscan, show changes, and update if user confirms.
</objective>

<process>
## STEP 1: Get current installed version

```bash
cat ~/.claude/eliniscan/package.json 2>/dev/null | grep '"version"' | head -1
```

If no package.json found, say version is unknown.

## STEP 2: Check latest version on GitHub

```bash
curl -s https://raw.githubusercontent.com/AlpYenigun/eliniscan/main/package.json | grep '"version"' | head -1
```

## STEP 3: Compare versions

If same version, display:
```
✓ eliniscan is up to date (v{version})
```

If different (or unknown local), display:
```
eliniscan update available: {current} → {latest}
```
Then ask user to confirm.

## STEP 4: Update (after user confirms)

Run these commands:
```bash
rm -rf /tmp/eliniscan-update
git clone --depth 1 https://github.com/AlpYenigun/eliniscan.git /tmp/eliniscan-update 2>/dev/null
cd /tmp/eliniscan-update && node scripts/install.js
cp /tmp/eliniscan-update/package.json ~/.claude/eliniscan/package.json
rm -rf /tmp/eliniscan-update
```

## STEP 5: Display result

```
✓ eliniscan updated to v{version}

  Restart Claude Code to use the new version.
```
</process>
