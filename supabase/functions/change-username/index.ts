import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChangeUsernameRequest {
  target_user_id: string;
  new_username: string;
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

    const body: ChangeUsernameRequest = await req.json();
    const { target_user_id, new_username } = body;

    if (!target_user_id || typeof target_user_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing target_user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof new_username !== 'string' || new_username.length < 3 || new_username.length > 50) {
      return new Response(JSON.stringify({ error: 'Username must be 3-50 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // A manager may only rename worker/citizen accounts — mirrors the same
    // restriction reset-staff-password and create-user apply.
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

    const cleanUsername = new_username.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanUsername.length < 3) {
      return new Response(JSON.stringify({ error: 'Username must contain at least 3 letters or digits' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check the new username isn't already taken by a different user
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', new_username)
      .neq('id', target_user_id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const proxyEmail = `${cleanUsername}@victory.local`;

    const { data: updatedUser, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
      email: proxyEmail,
      user_metadata: { username: new_username },
    });

    if (updateAuthError || !updatedUser.user) {
      console.error('Error updating auth user:', updateAuthError);
      return new Response(JSON.stringify({ error: updateAuthError?.message || 'Failed to update username' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ username: new_username })
      .eq('id', target_user_id);

    if (profileError) {
      console.error('Error updating profile username:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to update profile username' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, username: new_username }), {
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
