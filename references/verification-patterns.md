# Verification Patterns

## Core Principle

**Fix ≠ Fixed.** Writing a file does not mean the issue is resolved. Verification must check:

1. **Exists** — Fixed file is present and non-empty
2. **Substantive** — Fix is real code, not a placeholder or explanation
3. **Wired** — File still integrates with the rest of the system
4. **Functional** — Build passes, no new errors

## Level 1: Exists

```bash
# File exists and is not empty
[[ -f "$FILEPATH" ]] && [[ -s "$FILEPATH" ]]
```

## Level 2: Substantive

```bash
# First line is valid code
FIRST=$(head -1 "$FILEPATH")
echo "$FIRST" | grep -qE '^(import |"use |export |//|/\*|const |let |var |function |class )'

# No stub patterns
! grep -qE '(TODO|FIXME|PLACEHOLDER|implement later|coming soon)' "$FILEPATH"

# No accidental text output (Claude sometimes writes explanations)
! head -1 "$FILEPATH" | grep -qiE '(here|the|this|i |dosya|fix|düzelt)'
```

## Level 3: Wired

```bash
# TypeScript can parse it (syntax check)
npx tsc --noEmit --pretty false "$FILEPATH" 2>&1

# Imports resolve
grep -E '^import' "$FILEPATH" | while read line; do
  # Check import paths exist
done
```

## Level 4: Functional

```bash
# Full build
npm run build 2>&1 | tail -5

# If test runner exists
npm test 2>&1 | tail -10
```

## Verification Flow

```
Fix applied
    │
    ▼
Level 1: File exists & non-empty?
    │ NO → FAIL, restore backup
    ▼
Level 2: First line is code? No stubs?
    │ NO → FAIL, restore backup
    ▼
Level 3: tsc passes for this file?
    │ NO → WARN (may be pre-existing)
    ▼
Level 4: Build passes?
    │ NO → Check if fix caused it
    ▼
    PASS
```
