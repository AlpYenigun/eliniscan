# Fix Safety Rules

## Golden Rules

1. **If unsure, don't fix** — A skipped fix is better than a broken app
2. **Preserve behavior** — Fix the bug, don't refactor the code
3. **Keep signatures** — Never change what a function accepts or returns
4. **One concern per fix** — Don't combine fixes that affect different behavior
5. **Validate output** — If Claude returns text instead of code, reject it

## Output Validation

Before writing Claude's fix to disk, verify:

```bash
FIRST_LINE=$(head -1 "$TEMP_FIX")

# Must look like code, not explanation
VALID_STARTS="^(import |\"use |export |//|/\*|const |let |var |function |class |interface |type |enum |\{|$)"

if ! echo "$FIRST_LINE" | grep -qE "$VALID_STARTS"; then
  echo "REJECTED: output is not code"
  # Restore from backup
fi
```

## Fix Categories

### Always Safe (auto-apply)
| Pattern | Fix | Risk |
|---------|-----|------|
| Empty catch | Add `console.error(err)` | None |
| Missing await | Add `await` keyword | None |
| Missing try/catch | Wrap DB call | None |
| Null access | Add `?.` optional chain | None |
| Hardcoded value | Move to env/config | Low |

### Needs Care (apply but verify)
| Pattern | Fix | Risk |
|---------|-----|------|
| Race condition | Add AbortController | Medium |
| Missing rate limit | Add middleware | Medium |
| XSS via innerHTML | Add sanitizer | Medium |
| useEffect deps | Add missing deps | Medium — may cause infinite loop |

### Never Auto-Fix
| Pattern | Why |
|---------|-----|
| Auth flow changes | Could lock users out |
| DB schema changes | Could lose data |
| API response format | Could break clients |
| State management refactor | Too many side effects |
| Component restructuring | Too many files affected |

## Rollback Strategy

Always backup before fix:
```bash
cp "$FILEPATH" "${FILEPATH}.bak"
```

If fix fails validation:
```bash
mv "${FILEPATH}.bak" "$FILEPATH"
```

If all fixes succeed, remove backups:
```bash
find . -name "*.bak" -delete
```
