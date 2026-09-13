# Catch-up deployment — member creation fix

Member creation currently fails on every attempt. Two things are out of date on
the live project; both must be applied, in this order.

## Symptoms this fixes

- `Could not find the 'upi_id' column of 'master_staff' in the schema cache`
- `यूज़रनेम "..." पहले से मौजूद है` for a member who is **not** in the staff list
  and **not** visible in Supabase → Authentication → Users

## 1. Apply the pending SQL

Supabase dashboard → SQL Editor → paste the whole of
`APPLY_PENDING_MIGRATIONS.sql` → Run.

Safe to re-run: every statement is idempotent, so it does not matter which of
the migrations were already applied.

Read the **Messages/Notices** pane afterwards. It prints how many orphaned auth
users existed before and after, and the final `SELECT` lists any that remain.

## 2. Deploy the `delete-user` edge function

This one has never been deployed — it is the only function in
`supabase/functions/` that was never committed to git, and the roster-rollback
path calls it on every failed member creation. That call has been failing
silently, which is why the half-created logins were left behind.

```bash
supabase functions deploy delete-user
```

Verify all four are live:

```bash
supabase functions list
# expect: change-username, create-user, delete-user, reset-staff-password
```

## 3. Clear the orphaned worker login

Run `DELETE_NIRAJ04.sql`, then `CHECK_NIRAJ04.sql`, each in its own tab with
nothing selected.

`STEP3_DELETE_ORPHANS.sql` is the combined version and is kept for reference,
but prefer the two single-statement files. See "Reading the SQL Editor" below
for why.

### Reading the SQL Editor

Two things about this editor cost real time here:

- **It runs the selected text.** With a selection, the rest of the file is
  skipped. Run with nothing selected, or run one block at a time.
- **It shows only the last statement's grid.** In a file of preview → delete →
  confirm, an earlier preview's rows can stay on screen and look like the
  confirm step's output, i.e. like the delete failed when it never ran.
- **A `DO` block always reports "Success. No rows returned".** It returns no
  rows by design, whether it changed everything or matched nothing. Its
  `RAISE NOTICE` output goes to the Messages/Notices pane, not Results — which
  is why `CHECK_NIRAJ04.sql` is a plain `SELECT` returning a verdict instead.

**Admin and manager accounts are excluded, deliberately.** They are *supposed*
to have no `master_staff` row — `fetchStaffCollectorInfo` reads a missing row
for those two roles as "genuine admin/manager, stays unscoped" and gates
Master OS on the Supabase role instead. Deleting your own admin login would
lock you out of the project.

Alternatively, do it by hand in Authentication → Users — but search by the
**username** column from the query, not the member's display name. That is why
the orphan looked invisible: it was stored as `niraj04`, not `Niraj`.

If you would rather keep an orphaned account, re-saving that member in the
admin panel writes the missing roster row instead of deleting the login.

## 4. Retry

Create the member again. If `upi_id` still errors for a minute or two, PostgREST
is still serving its cached schema — the script ends with
`NOTIFY pgrst, 'reload schema'`, but you can also force it from
Settings → API → Restart server.

---

## What changed in the app code

`src/contexts/SamitiContext.tsx`, `addStaff`:

- The pre-flight username check now queries `profiles` as well as
  `master_staff`. Only checking the roster let an orphaned login through to
  `create-user`, which then reported a duplicate for a member the staff list had
  never shown. An orphan is now named as an incomplete account, with the fix.
- The rollback `delete-user` call no longer swallows its own failure. When the
  rollback does not go through, the toast says the login survived and must be
  removed before retrying, instead of reporting a clean "खाता बनाया नहीं गया".
- A missing-column / `PGRST204` failure is now reported as pending migrations
  pointing at this directory, rather than as raw PostgREST text.
