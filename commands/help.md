---
name: eliniscan:help
description: Show available eliniscan commands and usage guide
---
<objective>
Display the eliniscan command reference. Output ONLY the reference below — no project analysis, no suggestions.
</objective>

<process>
Output this exactly:

```
═══════════════════════════════════════════════════
  eliniscan — AI Full Codebase Scanner
═══════════════════════════════════════════════════

  COMMANDS

  /eliniscan:scan     Full codebase scan (file by file, separate sessions)
  /eliniscan:fix      Auto-fix all found issues (batch 500, verify, build)
  /eliniscan:report   Show scan/fix summary with charts
  /eliniscan:update   Check for updates and install latest version
  /eliniscan:help     This help message

  SCAN OPTIONS

  --depth full        Scan every line (default)
  --depth quick       Scan only critical patterns
  --model opus        Use Opus for scanning (thorough, slower)
  --model sonnet      Use Sonnet for scanning (fast, default)
  --model haiku       Use Haiku for scanning (fastest, less thorough)
  --severity all      Report all severities (default)
  --severity high     Report only CRITICAL and HIGH

  FIX OPTIONS

  --severity critical Fix only CRITICAL issues
  --severity high     Fix CRITICAL + HIGH
  --severity all      Fix everything (default)
  --batch-size 500    Findings per batch (default: 500)
  --skip-verify       Skip verify scan after fix
  --skip-build        Skip build check after fix

  WORKFLOW

  1. /eliniscan:scan          Scan entire codebase
  2. /eliniscan:report        Review findings
  3. /eliniscan:fix           Auto-fix issues
  4. /eliniscan:scan          Re-scan to verify

  FILES GENERATED

  ELINISCAN-FINDINGS.md     All issues with IDs (#001, #002...)
  ELINISCAN-TRACKING.md     File-by-file scan status
  FIX-TRACKING.md           Fix results per file

  INSTALL

  npm install -g eliniscan

  ABOUT

  eliniscan opens a separate Claude session for every file in your
  codebase. Each file gets 100% of the context window — no skipping,
  no summarizing, every line is read and analyzed.

  GitHub: https://github.com/alpyenigun/eliniscan
```
</process>
