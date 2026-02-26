

# Fix FUN Money Stats RPC - Invalid Numeric Cast

## Problem
The `get_fun_money_system_stats` RPC function fails with error:
```
invalid input syntax for type numeric: "1010.00 FUN"
```

The `calculated_amount_formatted` column in `mint_requests` stores values like `"1010.00 FUN"` (with a text suffix). The current SQL tries to `CAST(calculated_amount_formatted AS numeric)` directly, which fails.

## Solution

Update the RPC function to strip the " FUN" suffix before casting. Replace all occurrences of:
```sql
CAST(calculated_amount_formatted AS numeric)
```
with:
```sql
CAST(REGEXP_REPLACE(calculated_amount_formatted, '[^0-9.]', '', 'g') AS numeric)
```

This affects 4 locations in the function:
1. **Line 25** - Total minted calculation
2. **Line 84** - Status breakdown total_fun
3. **Line 98** - Top holders total_fun  
4. **Line 116** - Daily mints total_fun

## Changes

| What | Detail |
|------|--------|
| Database migration | New migration to `CREATE OR REPLACE FUNCTION` with fixed CAST logic |

No frontend changes needed -- the hook and component are already correct, they just need valid data from the RPC.

