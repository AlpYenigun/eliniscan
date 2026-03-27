---
name: eliniscan:report
description: Display scan/fix summary with severity breakdown, categories, and top issues
allowed-tools:
  - Read
  - Bash
  - Grep
---
<objective>
Read ELINISCAN-FINDINGS.md and ELINISCAN-TRACKING.md, generate a human-readable summary.
</objective>

<context>
## Output Format
```
═══════════════════════════════════════════════════
  eliniscan Report
═══════════════════════════════════════════════════

  Files scanned:    {X} / {Y}
  Total issues:     {N}
  Fixed:            {F}
  Remaining:        {R}

  ── Severity ──────────────────────────────────
  CRITICAL    {n}    ████░░░░░░  {%}
  HIGH        {n}    ██████░░░░  {%}
  MEDIUM      {n}    ████████░░  {%}
  LOW         {n}    ██████████  {%}

  ── Categories ────────────────────────────────
  Security:        {n}
  Bug:             {n}
  Performance:     {n}
  Error Handling:  {n}
  Code Quality:    {n}

  ── Top Patterns ──────────────────────────────
  1. {pattern} ({count}x)
  2. {pattern} ({count}x)
  ...

  Next: /eliniscan:fix    — auto-fix issues
        /eliniscan:scan   — re-scan codebase
```
</context>
