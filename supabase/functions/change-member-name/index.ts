import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChangeMemberNameRequest {
  target_user_id: string;
  new_name: string;
}

/**
 * Renames a member everywhere their name is *read from*, not just on the roster.
 *
 * The admin panel writes `master_staff.name`, but a signed-in member's own
 * screens render `profiles.full_name` (see `useAuth.fetchUserData`, and the
 * `profile?.full_name || currentStaffMember?.name` fallbacks in the unit
 * views — profile wins, so a stale value there hides the new roster name).
 * `full_name` was previously only ever written once, by create-user, so an
 * edited name never reached the member's account.
 *
 * This runs as an edge function rather than a client-side update because RLS
 * only grants UPDATE on `profiles` to admins: a manager renaming a member
 * would otherwise have the write silently discarded by the policy.
 */
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

    const body: ChangeMemberNameRequest = await req.json();
    const { target_user_id, new_name } = body;

    if (!target_user_id || typeof target_user_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing target_user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Same bounds create-user applies to full_name, so a name that is valid at
    // creation stays valid on edit.
    const trimmedName = typeof new_name === 'string' ? new_name.trim() : '';
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return new Response(JSON.stringify({ error: 'Name must be 2-100 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // A manager may only rename worker/citizen accounts — mirrors the same
    // restriction change-username, reset-staff-password and create-user apply.
    if (isManager) {
      const { data: targetRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', target_user_id)
        .single();

      if (targetRole?.role === 'admin' || targetRole?.role === 'manager') {
        return new Response(JSON.stringify({ error: 'Managers can only rename Worker or Citizen accounts' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: trimmedName })
      .eq('id', target_user_id);

    if (profileError) {
      console.error('Error updating profile full_name:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to update profile name' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Kept in step with the profile so anything reading the name off the JWT
    // metadata (rather than the profiles row) does not keep serving the old one.
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
      user_metadata: { full_name: trimmedName },
    });

    if (authUpdateError) {
      console.error('Error updating auth user metadata:', authUpdateError);
      return new Response(JSON.stringify({ error: authUpdateError.message || 'Failed to update account name' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, full_name: trimmedName }), {
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
