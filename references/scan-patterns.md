# Scan Patterns Reference

## Security Patterns to Detect

### Critical
- Hardcoded secrets: API keys, tokens, passwords in source code
- SQL injection: string concatenation in queries
- XSS: `dangerouslySetInnerHTML` without sanitization
- Auth bypass: missing authentication checks on API routes
- SSRF: user-controlled URLs in server-side fetch
- Path traversal: user input in file paths without validation
- Token in URL: sensitive data in query params (leaks via Referer)

### High
- Missing rate limiting on auth endpoints
- IDOR: accessing resources by ID without ownership check
- CSRF: state-changing operations without CSRF token
- Insecure cookie: missing httpOnly, secure, sameSite flags
- Weak crypto: MD5, SHA1 for passwords
- Open redirect: user-controlled redirect URLs

## Bug Patterns to Detect

### Critical
- Race conditions: TOCTOU in database operations
- Transaction missing: multiple DB writes without transaction
- Null dereference: accessing property on potentially null value

### High
- Empty catch blocks: errors silently swallowed
- Async without await: fire-and-forget that should be awaited
- Wrong field name: using `changeResourceType` where `operation` expected
- Stale closure: missing useEffect dependencies
- Memory leak: event listeners not cleaned up

## Performance Patterns

### High
- N+1 queries: DB call inside a loop
- Missing pagination: `SELECT *` without LIMIT
- Client-side filtering after fetching all data
- Large bundle: importing entire library for one function

### Medium
- Missing memoization: expensive computation on every render
- Unnecessary re-renders: inline object/function in JSX props
- Missing AbortController: fetch without cancellation

## Code Quality Patterns

### Medium
- `any` type with eslint-disable
- Duplicate code: same logic in multiple files
- Hardcoded values: magic numbers, URLs, IDs in source
- Giant files: 1000+ lines that should be split
- `window.confirm`: blocking UI, not accessible

### Low
- Inconsistent error messages: mix of Turkish and English
- Missing autoComplete on password inputs
- Native HTML elements where design system component exists
