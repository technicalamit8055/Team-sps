import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  username: string;
  password: string;
  full_name: string;
  role: 'admin' | 'manager' | 'worker' | 'citizen';
  ward_number?: number;
  phone?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the requesting user is admin or manager
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if requesting user is admin or manager
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Could not verify user role' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const isAdmin = roleData.role === 'admin';
    const isManager = roleData.role === 'manager';

    if (!isAdmin && !isManager) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin or Manager role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: CreateUserRequest = await req.json();
    const { username, password, full_name, role, ward_number, phone } = body;

    // Validate required fields
    if (!username || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate input lengths and formats
    if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
      return new Response(JSON.stringify({ error: 'Username must be 3-50 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 100) {
      return new Response(JSON.stringify({ error: 'Password must be 8-100 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (typeof full_name !== 'string' || full_name.length < 2 || full_name.length > 100) {
      return new Response(JSON.stringify({ error: 'Full name must be 2-100 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate role is one of allowed values
    const validRoles = ['admin', 'manager', 'worker', 'citizen'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate optional fields
    if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.length > 20)) {
      return new Response(JSON.stringify({ error: 'Phone must be a string up to 20 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (ward_number !== undefined && ward_number !== null && (typeof ward_number !== 'number' || ward_number < 1 || ward_number > 100)) {
      return new Response(JSON.stringify({ error: 'Ward number must be between 1 and 100' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Managers can only create worker and citizen accounts
    if (isManager && (role === 'admin' || role === 'manager')) {
      return new Response(JSON.stringify({ error: 'Managers can only create Worker or Citizen accounts' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if username already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingProfile) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create the proxy email from username
    const proxyEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@victory.local`;

    // Create user in auth.users using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: proxyEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: username,
        full_name: full_name
      }
    });

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError);
      return new Response(JSON.stringify({ error: createError?.message || 'Failed to create user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        username: username,
        full_name: full_name,
        phone: phone || null,
        ward_number: ward_number || null
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ error: 'Failed to create user profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create role entry
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role
      });

    if (roleInsertError) {
      console.error('Error creating role:', roleInsertError);
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ error: 'Failed to assign user role' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`User created successfully: ${username} with role ${role}`);

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: newUser.user.id,
        username: username,
        full_name: full_name,
        role: role,
        ward_number: ward_number
        // Password not returned - client already has it from generation
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
