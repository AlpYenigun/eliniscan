---
name: eliniscan:help
description: Show available eliniscan commands and usage guide
---
<objective>
Display the eliniscan command reference. Output ONLY the reference below.
</objective>

<process>
Output this exactly:

```
═══════════════════════════════════════════════════
  eliniscan — AI Full Codebase Scanner
  https://github.com/alpyenigun/eliniscan
═══════════════════════════════════════════════════

  CORE COMMANDS

  /eliniscan:scan       Full codebase scan (file by file, separate sessions)
  /eliniscan:fix        Auto-fix all found issues (batch, verify, build)
  /eliniscan:report     Show scan/fix summary with charts
  /eliniscan:status     Show current progress (scan/fix running?)

  MANAGEMENT

  /eliniscan:resume     Resume interrupted scan or fix
  /eliniscan:clean      Remove all generated files and reset state
  /eliniscan:settings   View and modify configuration
  /eliniscan:update     Check for updates and install latest version
  /eliniscan:help       This help message

  SCAN OPTIONS

  --depth Full          Scan every line (default)
  --depth Quick         Scan only critical patterns
  --model Opus          Most thorough (slower)
  --model Sonnet        Balanced (default, recommended)
  --model Haiku         Fastest (may miss subtle issues)
  --severity All        Report everything (default)
  --severity High       Only CRITICAL and HIGH

  FIX OPTIONS

  --severity Critical   Fix only CRITICAL issues
  --severity High       Fix CRITICAL + HIGH
  --severity All        Fix everything (default)
  --model Opus          Most accurate fixes
  --model Sonnet        Fast and reliable (default)

  WORKFLOW

  1. /eliniscan:scan          Scan entire codebase
  2. /eliniscan:report        Review findings
  3. /eliniscan:fix           Auto-fix issues
  4. /eliniscan:scan          Re-scan to verify

  If interrupted at any step: /eliniscan:resume

  FILES GENERATED

  ELINISCAN-FINDINGS.md     All issues with IDs (#001, #002...)
  ELINISCAN-TRACKING.md     File-by-file scan status
  FIX-TRACKING.md           Fix results per file

  ARCHITECTURE

  - CLI tool:    ~/.claude/eliniscan/bin/eliniscan-tools.cjs
  - Commands:    ~/.claude/commands/eliniscan/
  - Workflows:   ~/.claude/eliniscan/workflows/
  - Agents:      ~/.claude/agents/eliniscan-*.md
  - References:  ~/.claude/eliniscan/references/
  - Config:      ~/.claude/eliniscan/config.json
  - State:       ~/.claude/eliniscan/state.json

  GitHub: https://github.com/alpyenigun/eliniscan
```
</process>
