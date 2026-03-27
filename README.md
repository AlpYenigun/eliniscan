# eliniscan

**AI-powered full codebase scanner for [Claude Code](https://code.claude.com).** Opens a separate Claude session for every file — reads every line, misses nothing.

> I had 942 files and 189,000 lines of code. No matter what I tried — agents, GSD workflows, manual prompting — Claude always skipped lines, summarized instead of reading, and produced shallow reports. After 10+ failed sessions, I built eliniscan. It opened 942 separate Claude sessions, one per file, each with a fresh 1M context window. 11 hours later: **3,894 real issues found**. Every line was actually read.

## The Problem

AI code review tools scan diffs or use regex patterns. Claude Code reads your code in conversation, but:

- **Context fills up** → earlier files get compressed → details lost
- **Claude optimizes** → skips "boring" JSX, summarizes instead of reading
- **You can't verify** → no proof every line was actually analyzed

## The Solution

eliniscan takes a different approach:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   File 1    │     │   File 2    │     │   File N    │
│ Fresh 1M    │     │ Fresh 1M    │     │ Fresh 1M    │
│ context     │     │ context     │     │ context     │
│ 100% focus  │     │ 100% focus  │     │ 100% focus  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────┬───────┘───────────────────┘
                   │
          ┌────────▼────────┐
          │  FINDINGS.md    │
          │  #001, #002...  │
          │  Every issue    │
          │  with line no.  │
          └─────────────────┘
```

Each file gets its own Claude session. No shared context, no compression, no skipping. The only way to guarantee every line is read.

## Install

```bash
npm install -g eliniscan
```

Requires [Claude Code](https://code.claude.com) CLI (`claude` command).

## Usage

Inside Claude Code, use these commands:

### Scan

```
/eliniscan:scan
```

Asks you:
1. **Depth**: `full` (every line) or `quick` (critical patterns)
2. **Model**: `opus` (thorough), `sonnet` (balanced), `haiku` (fast)
3. **File types**: Default `ts,tsx,js,jsx,css`
4. **Severity**: `all` or `high` (CRITICAL + HIGH only)

Then scans every file. Progress shown live:

```
[142/942] (15%) src/app/api/auth/login/route.ts (89 lines)
  ⚠ 4 issues
[143/942] (15%) src/app/api/auth/logout/route.ts (23 lines)
  ✓ CLEAN
```

### Fix

```
/eliniscan:fix
```

Three-phase auto-fix:

1. **Fix** — sends each file + its findings to Claude, writes fixed code
2. **Verify** — re-scans fixed files for new issues, fixes those too
3. **Build** — runs `tsc --noEmit` + `npm run build`

### Report

```
/eliniscan:report
```

Shows summary:

```
═══════════════════════════════════════════════════
  eliniscan Report
═══════════════════════════════════════════════════

  Files scanned:    942 / 942
  Total issues:     3,894
  Fixed:            3,047

  ── Severity ──────────────────────────────────
  CRITICAL    128    ██░░░░░░░░  3%
  HIGH        854    ████░░░░░░  22%
  MEDIUM     1357    ██████░░░░  35%
  LOW        1207    █████░░░░░  31%

  ── Categories ────────────────────────────────
  Security:        1,179
  Bug:             2,057
  Performance:       732
  Error Handling:    918
  Code Quality:      448
```

### Update

```
/eliniscan:update
```

Checks npm for newer version, shows changelog, updates.

## What It Finds

| Category | Examples |
|----------|---------|
| **Security** | XSS, SQL injection, auth bypass, token leak, IDOR, hardcoded secrets, missing rate limiting |
| **Bugs** | Null crashes, race conditions, wrong field usage, infinite loops, unhandled errors |
| **Performance** | N+1 queries, missing memoization, unnecessary re-renders, memory leaks |
| **Error Handling** | Empty catch blocks, silent error swallowing, missing error boundaries |
| **Code Quality** | Duplicate code, hardcoded values, `any` types, inconsistent patterns |

## Real-World Results

Tested on a production Next.js app (942 files, 189K lines):

| Metric | Value |
|--------|-------|
| Files scanned | 942 |
| Lines read | 189,091 |
| Issues found | 3,894 |
| CRITICAL | 128 |
| HIGH | 854 |
| Scan time | 11.4 hours (Sonnet) |
| Fix rate | 78% auto-fixed |

Top findings:
- 32× `logActivity` not awaited (silent failures)
- 9× Missing rate limiting on API routes
- 40+ DB queries without try/catch
- Race conditions in WebSocket handlers
- Hardcoded Google Drive folder IDs

## How It Compares

| Feature | eliniscan | ESLint/CodeQL | PR review tools | Claude in chat |
|---------|-----------|---------------|-----------------|----------------|
| Reads every line | ✅ | ✅ (rules only) | ❌ (diff only) | ❌ (skips) |
| Understands logic | ✅ | ❌ | ❌ | ✅ |
| Finds race conditions | ✅ | ❌ | ❌ | Sometimes |
| No context limit | ✅ | ✅ | ❌ | ❌ |
| Auto-fix | ✅ | Some | ❌ | ❌ |
| Works on any project | ✅ | Config needed | GitHub only | ✅ |

## Requirements

- [Claude Code](https://code.claude.com) CLI installed and authenticated
- Node.js 18+
- Claude Pro/Max subscription (for `claude --print`)

## Cost Estimate

Using Sonnet (default):
- ~500 files: ~5 hours scan, ~3 hours fix
- ~1000 files: ~11 hours scan, ~7 hours fix

Using Opus (thorough):
- ~2x slower, catches more subtle issues

All runs on your existing Claude subscription — no additional API costs.

## Files Generated

| File | Description |
|------|-------------|
| `ELINISCAN-FINDINGS.md` | All issues with IDs (#001, #002...), severity, line numbers |
| `ELINISCAN-TRACKING.md` | File-by-file scan status (PENDING/SCANNED/CLEAN) |
| `FIX-TRACKING.md` | Fix results per file (FIXED/SKIPPED/FAILED) |

Add these to `.gitignore` if you don't want them in your repo.

## License

MIT

## Author

**Alp Yenigun** — Built while auditing a 189K line production codebase and getting frustrated that no tool would actually read every line.

- GitHub: [@alpyenigun](https://github.com/alpyenigun)
