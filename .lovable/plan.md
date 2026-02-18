

# Fix Wallet Detective - "structure of query does not match function result type"

## Root Cause
In PostgreSQL, `COUNT(*)` returns `bigint`, but `SUM(bigint)` returns `numeric`. The function declares `tx_count bigint` in its RETURNS TABLE, but the actual query produces `numeric` for that column. This type mismatch causes the error.

## Fix
Re-create the `trace_wallet_detective` RPC function with a single change: cast `SUM(sw.cnt)` to `bigint` in the `aggregated` CTE.

```sql
-- In the aggregated CTE, change:
SUM(sw.cnt) AS tx_count
-- To:
SUM(sw.cnt)::bigint AS tx_count
```

## Technical Details
- **File changed**: Database migration only (one SQL migration to `CREATE OR REPLACE` the function)
- **No frontend changes needed** - the `WalletDetectiveTab.tsx` component is correct; the bug is purely in the database function's type casting
- Works on both web and mobile since the fix is server-side

