# Model Profiles

## Profile Definitions

| Agent | `quality` | `balanced` | `budget` |
|-------|-----------|------------|----------|
| scanner | opus | sonnet | haiku |
| fixer | opus | sonnet | sonnet |
| verifier | sonnet | sonnet | haiku |

## Profile Philosophy

**quality** — Maximum accuracy
- Opus for scanning and fixing
- Catches subtle race conditions, logic errors
- 2-3x slower, 2-3x more tokens
- Use when: critical codebase, security audit, production code

**balanced** (default) — Smart allocation
- Sonnet for all operations
- Good balance of speed and accuracy
- Use when: regular development, CI/CD pipeline

**budget** — Minimum spend
- Haiku for scanning, Sonnet for fixing
- May miss subtle issues
- Use when: quick checks, large codebases, exploratory scan

## Runtime Model Mapping

| Runtime | `opus` | `sonnet` | `haiku` |
|---------|--------|----------|---------|
| Claude Code | `--model opus` | `--model sonnet` | `--model haiku` |
| Gemini CLI | `gemini-2.5-pro` | `gemini-2.5-flash` | `gemini-2.5-flash` |
| Codex | `o3` | `o4-mini` | `o4-mini` |
| OpenCode | configurable | configurable | configurable |

## Estimated Time & Cost

For a 500-file project:

| Profile | Scan Time | Fix Time | Total |
|---------|-----------|----------|-------|
| quality | ~8 hrs | ~12 hrs | ~20 hrs |
| balanced | ~4 hrs | ~6 hrs | ~10 hrs |
| budget | ~2 hrs | ~4 hrs | ~6 hrs |

Note: Times vary by file size, complexity, and model response time.
