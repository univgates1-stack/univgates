import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

serve(async (req) => {
  try {
    const { p_first_name, p_last_name } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response('Missing Supabase configuration', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const user = await supabase.auth.getUser();

    if (!user.data.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = user.data.user.id;
    const email = user.data.user.email ?? '';

    const fullName = `${p_first_name ?? ''} ${p_last_name ?? ''}`.trim();

    await supabase.rpc('ensure_user_profile', {
      p_user_id: userId,
      p_first_name: p_first_name ?? null,
      p_last_name: p_last_name ?? null,
      p_email: email,
    });

    const existingOfficial = await supabase
      .from('university_officials')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingOfficial.data) {
      const { error: officialError } = await supabase
        .from('university_officials')
        .insert({
          user_id: userId,
          authorized_person_name: fullName || null,
          authorized_person_email: email || null,
          status: 'pending',
        });

      if (officialError) {
        return new Response(`Failed to create university official profile: ${officialError.message}`, {
          status: 400,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('ensure_university_official_profile error:', error);
    return new Response('Unexpected error', { status: 500 });
  }
});
