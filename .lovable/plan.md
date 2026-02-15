

# Fix: App Stuck on "Đang tải..." (Loading) Screen

## Root Cause

The loading screen ("Đang tải...") in `Index.tsx` is controlled by the `loading` state from `useAuth()`. This state starts as `true` and only becomes `false` when one of two things happens:

1. `supabase.auth.onAuthStateChange` fires a callback
2. `supabase.auth.getSession()` resolves

**On slow mobile connections or when the backend is unreachable**, neither callback fires within a reasonable time, leaving the user stuck on "Đang tải..." indefinitely. There is no timeout, no error handling on `getSession()`, and no fallback.

Additionally, the cache-busting script in `index.html` clears **all localStorage** (including the saved auth session) on every version bump, forcing the Supabase client to make a network round-trip that may fail on poor connections.

## Changes

### File: `src/hooks/useAuth.tsx`
- Add a **safety timeout** (5 seconds): if neither `onAuthStateChange` nor `getSession` has resolved by then, force `loading = false` so the homepage renders (user simply appears logged out)
- Add `.catch()` error handling on `getSession()` so a network failure does not leave the promise dangling silently
- Use a flag to prevent the timeout from firing if auth already resolved

### File: `index.html`
- Fix the cache-busting script to **preserve the Supabase auth keys** (`sb-` prefixed keys in localStorage) when clearing cache on version change. Currently it wipes everything, destroying the user's session and forcing a network round-trip that may fail on mobile

## Technical Details

```text
Current flow (broken on slow network):
  App starts -> useAuth sets loading=true
  -> getSession() hangs / onAuthStateChange never fires
  -> loading stays true forever
  -> User sees "Đang tải..." forever

Fixed flow:
  App starts -> useAuth sets loading=true
  -> getSession() resolves OR onAuthStateChange fires -> loading=false (normal)
  -> If neither fires in 5s -> timeout sets loading=false (fallback)
  -> User sees homepage (logged out if session failed)
```

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Add 5s timeout fallback + error handling on getSession |
| `index.html` | Preserve Supabase auth keys during cache clear |

