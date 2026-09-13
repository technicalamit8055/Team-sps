import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  /** master_staff row id. Always removed, even when no auth user is linked. */
  staff_id: string;
  /**
   * Username to fall back on when no roster row exists for `staff_id`.
   *
   * Used to roll back a half-created account: the login has been created but
   * the roster write failed, so there is no row to resolve the auth user from.
   * Only ever a fallback — when a roster row exists, its `user_id` wins, so
   * this can never redirect the deletion at an unrelated account.
   */
  fallback_username?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Could not verify user role' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isAdmin = roleData.role === 'admin';
    const isManager = roleData.role === 'manager';

    if (!isAdmin && !isManager) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin or Manager role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: DeleteUserRequest = await req.json();
    const { staff_id, fallback_username } = body;

    if (!staff_id || typeof staff_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing staff_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // The linked auth user is resolved from the roster row, never taken from the
    // request body — otherwise a caller could aim the deletion at an arbitrary
    // account by passing someone else's user id.
    const { data: staffRow, error: staffLookupError } = await supabaseAdmin
      .from('master_staff')
      .select('id, name, username, user_id')
      .eq('id', staff_id)
      .maybeSingle();

    if (staffLookupError) {
      console.error('Error looking up staff row:', staffLookupError);
      return new Response(JSON.stringify({ error: 'Could not look up staff member' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let targetUserId: string | null = (staffRow as { user_id?: string | null } | null)?.user_id ?? null;
    // The roster row's own username always wins. `fallback_username` applies
    // only when there is no row at all — the half-created-account rollback.
    const targetUsername: string | null =
      (staffRow as { username?: string | null } | null)?.username ??
      (staffRow ? null : fallback_username ?? null);

    // Rows created before user_id was backfilled carry only a username. Fall
    // back to the profile so those accounts are locked out too, instead of
    // silently surviving the delete.
    if (!targetUserId && targetUsername) {
      const { data: profileRow } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('username', targetUsername.trim())
        .maybeSingle();
      targetUserId = (profileRow as { id?: string } | null)?.id ?? null;
    }

    // Nobody may delete their own account: it would strip the acting admin's own
    // session mid-request and can orphan the last remaining admin.
    if (targetUserId && targetUserId === requestingUser.id) {
      return new Response(JSON.stringify({ error: 'You cannot delete your own account' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (targetUserId) {
      const { data: targetRoleRow } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId)
        .single();
      const targetRole = targetRoleRow?.role ?? null;

      // Mirrors create-user / reset-staff-password: a manager may only act on
      // worker and citizen accounts.
      if (isManager && (targetRole === 'admin' || targetRole === 'manager')) {
        return new Response(JSON.stringify({ error: 'Managers can only delete Worker or Citizen accounts' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Never delete the last admin — that locks everyone out of Master OS with
      // no way back in through the app.
      if (targetRole === 'admin') {
        const { count } = await supabaseAdmin
          .from('user_roles')
          .select('user_id', { count: 'exact', head: true })
          .eq('role', 'admin');

        if ((count ?? 0) <= 1) {
          return new Response(JSON.stringify({ error: 'Cannot delete the last remaining admin account' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Order matters. The auth user goes first: once it is gone the credentials
    // stop working everywhere immediately and every issued refresh token dies
    // with it, so a device already signed in cannot renew its session. If a
    // later step fails the account is still locked out, leaving at worst an
    // orphaned row — the safe direction to fail in.
    if (targetUserId) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

      // An id that no longer exists is not a failure: the goal is that the
      // account cannot sign in, and that already holds.
      if (deleteAuthError && !/not found/i.test(deleteAuthError.message || '')) {
        console.error('Error deleting auth user:', deleteAuthError);

        // GoTrue collapses every Postgres failure here into the single string
        // "Database error deleting user" and does not pass the detail through,
        // so this is the one place that can explain it. In practice it means a
        // foreign key into auth.users is still set to NO ACTION and the member
        // has data referencing them — see
        // supabase/migrations/20260913180000_fix_auth_user_delete_fks.sql,
        // which rewrites those keys, and supabase/manual/WHY_DELETE_FAILS.sql,
        // which lists whichever ones are still blocking.
        const isOpaqueDbError = /database error deleting user/i.test(deleteAuthError.message || '');
        const message = isOpaqueDbError
          ? 'This member has recorded data (donations, expenses, tasks) that is still linked to their login, ' +
            'and the database is refusing to remove the login while it is. ' +
            'Apply the pending migration 20260913180000_fix_auth_user_delete_fks.sql, then try again.'
          : deleteAuthError.message || 'Failed to delete login account';

        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // profiles / user_roles may or may not cascade from auth.users depending
      // on how the schema was provisioned, so both are cleared explicitly. A
      // leftover profile keeps the username occupied when the member is
      // re-created, and a leftover role row would grant that role to whoever
      // ends up with the id.
      const { error: roleDeleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', targetUserId);
      if (roleDeleteError) {
        console.warn('Could not delete user_roles row:', roleDeleteError.message);
      }

      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', targetUserId);
      if (profileDeleteError) {
        console.warn('Could not delete profile row:', profileDeleteError.message);
      }
    }

    const { error: staffDeleteError } = await supabaseAdmin
      .from('master_staff')
      .delete()
      .eq('id', staff_id);

    if (staffDeleteError) {
      console.error('Error deleting staff row:', staffDeleteError);
      return new Response(JSON.stringify({
        error: 'Login was disabled, but the roster entry could not be removed. Please retry.',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(
      `Staff deleted: ${targetUsername || staff_id} (auth user ${targetUserId ?? 'none'}) by ${requestingUser.id}`
    );

    return new Response(JSON.stringify({
      success: true,
      staff_id,
      deleted_auth_user: Boolean(targetUserId),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
