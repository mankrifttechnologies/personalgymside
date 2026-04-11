import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify caller is an owner/admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { data: roleData } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || !['admin', 'owner'].includes(roleData.role)) {
      throw new Error('Only organization owners or admins can bulk create members');
    }

    const { members, organization_id } = await req.json();

    if (!members || !Array.isArray(members) || members.length === 0) {
      throw new Error('No member data provided');
    }

    if (!organization_id) {
      throw new Error('Organization ID is required');
    }

    // Verify user owns this organization
    if (roleData.role === 'owner') {
      const { data: org } = await userClient
        .from('organizations')
        .select('id')
        .eq('id', organization_id)
        .eq('owner_id', user.id)
        .single();

      if (!org) throw new Error('You do not own this organization');
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const success: Array<{ name: string; email: string; password: string; member_code: string }> = [];
    const errors: Array<{ row: number; name: string; error: string }> = [];

    for (let i = 0; i < members.length; i++) {
      const row = members[i];
      const name = row.name?.trim();
      const email = row.email?.trim()?.toLowerCase();
      const phone = row.phone?.trim() || null;
      const age = row.age ? parseInt(row.age) : null;
      const gender = row.gender?.trim()?.toLowerCase() || null;

      if (!name) {
        errors.push({ row: i + 2, name: name || '', error: 'Name is required' });
        continue;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: i + 2, name, error: 'Valid email is required' });
        continue;
      }

      const password = generatePassword();

      try {
        // Create auth user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
        });

        if (createError) {
          errors.push({ row: i + 2, name, error: createError.message });
          continue;
        }

        // Update profile
        await adminClient
          .from('profiles')
          .update({
            name,
            age,
            gender,
            is_approved: true,
          })
          .eq('user_id', newUser.user.id);

        // Create gym_member record
        const memberCode = 'FIT' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        await adminClient.from('gym_members').insert({
          user_id: newUser.user.id,
          member_code: memberCode,
          status: 'active',
          organization_id,
        });

        // Assign member role
        await adminClient.from('user_roles').insert({
          user_id: newUser.user.id,
          role: 'member',
        });

        // Add to organization_members
        await adminClient.from('organization_members').insert({
          organization_id,
          user_id: newUser.user.id,
          role: 'member',
        });

        success.push({ name, email, password, member_code: memberCode });
      } catch (err: any) {
        errors.push({ row: i + 2, name, error: err.message || 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({ success, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bulk create error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
