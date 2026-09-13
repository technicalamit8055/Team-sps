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

---

# Deleting a member fails: "Database error deleting user"

## What the message means

It is not the app's text and not a permissions problem. It is GoTrue's generic
wrapper for "Postgres refused the `DELETE FROM auth.users`". The real reason is
never passed back to the caller, which is why the admin panel could only show
the generic sentence.

The reason is a foreign key. The columns that point at `auth.users` —
`created_by`, `assigned_to`, `submitted_by`, `worker_id` and the rest — were
declared without an `ON DELETE` clause, which in Postgres means `NO ACTION`:
the delete is refused while any row still references it.

So the failure tracks how much the member had done, not who they were:

- a member who had recorded **nothing** yet deletes cleanly
- a member who had recorded **one donation, expense, task or voter** can never
  be deleted

That is what made it look random.

## The fix

SQL Editor → new tab → paste the whole of `FIX_DELETE_MEMBER.sql` → Run with
nothing selected.

It rewrites each blocking foreign key:

- **Authorship and assignment columns → `ON DELETE SET NULL`.** The records stay
  and only the attribution is cleared. A donation the member collected still
  happened: its amount, date and receipt number are the samiti's books, and
  deleting a member must not quietly rewrite them.
- **`profiles` and `user_roles` → `ON DELETE CASCADE`.** These describe the
  login and mean nothing without it. This also fixes the follow-on bug where
  re-creating a deleted member reported `यूज़रनेम "..." पहले से मौजूद है` — the
  leftover `profiles` row was still holding the username.

It also drops `NOT NULL` on `expenses.created_by` and `grievances.submitted_by`.
`SET NULL` cannot fire into a `NOT NULL` column, and those two were declared
that way — without this they would keep failing with the same opaque message.
"Attribution unknown" is exactly the state being recorded, so it has to be
storable.

The file ends with a `SELECT` that prints `CLEAR` or names whatever is still
blocking. Run it and read that grid rather than trusting the DO block's
"Success. No rows returned".

The same SQL is committed as
`supabase/migrations/20260913180000_fix_auth_user_delete_fks.sql`. Keep the two
identical.

## Then redeploy the edge function

```bash
supabase functions deploy delete-user
```

`delete-user` now recognises the opaque GoTrue string and reports what it
actually means, so if this recurs the panel names the cause instead of the
symptom.

## If it still fails

Run `WHY_DELETE_FAILS.sql`. The first grid lists every foreign key into
`auth.users` with its delete rule, blocking ones first. The second lists, for
one member, exactly which tables still hold rows referencing them — change the
username on the `member_username` line and Run again.

## What this does not change

Deleting a member still removes their login, profile, role and roster row, and
still revokes the refresh tokens of any device already signed in. The safeguards
are unchanged: you cannot delete your own account, managers cannot delete admins
or other managers, and the last remaining admin cannot be deleted.
