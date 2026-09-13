-- Retire the separate "tablet" role.
--
-- A shared tablet is no longer its own role or access level. It is an ordinary
-- Donation Only (collector) account carrying the `chooseCollectorName` module
-- permission, which lets the operator pick the संग्रहकर्ता on every receipt
-- instead of having it locked to the account holder.
--
-- Without this, accounts created under the old role keep an access level the
-- app no longer knows: `tablet` falls through to `no_access`, and the member
-- silently loses the donation screen they use every day.

-- 1. Access levels inside each workspace permission map.
--    'tablet' -> 'collector', and the name unlock is turned on so the device
--    keeps behaving exactly as it did before.
UPDATE public.master_staff AS s
SET workspace_permissions = (
  SELECT jsonb_object_agg(
    ws.key,
    CASE
      WHEN ws.value->>'accessLevel' = 'tablet' THEN
        jsonb_set(
          jsonb_set(ws.value, '{accessLevel}', '"collector"'::jsonb),
          '{modules,chooseCollectorName}',
          'true'::jsonb,
          true
        )
      ELSE ws.value
    END
  )
  FROM jsonb_each(s.workspace_permissions) AS ws(key, value)
)
WHERE workspace_permissions::text LIKE '%"tablet"%';

-- 2. The primary role itself.
UPDATE public.master_staff
SET primary_role = 'collector'
WHERE primary_role = 'tablet';
