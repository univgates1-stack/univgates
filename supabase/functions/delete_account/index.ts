import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

type SupabaseClient = ReturnType<typeof createClient>;

type MaybeRecord<T> = T | null;

type StudentRecord = { id: string };
type AgentRecord = { id: string };
type OfficialRecord = { id: string };
type AdminRecord = { id: string };

const deleteStudentData = async (client: SupabaseClient, studentId: string) => {
  const deletions = [
    client.from('student_exam_documents').delete().eq('student_id', studentId),
    client.from('student_degrees').delete().eq('student_id', studentId),
    client.from('student_passports').delete().eq('student_id', studentId),
    client.from('documents').delete().eq('student_id', studentId),
    client.from('applications').delete().eq('student_id', studentId),
  ];

  for (const operation of deletions) {
    const { error } = await operation;
    if (error) {
      throw new Error(error.message);
    }
  }

  const { error: studentError } = await client
    .from('students')
    .delete()
    .eq('id', studentId);

  if (studentError) {
    throw new Error(studentError.message);
  }
};

const deleteAgentData = async (client: SupabaseClient, agentId: string) => {
  const { error } = await client
    .from('agents')
    .delete()
    .eq('id', agentId);

  if (error) {
    throw new Error(error.message);
  }
};

const deleteAdministratorData = async (client: SupabaseClient, adminId: string) => {
  const { error } = await client
    .from('administrators')
    .delete()
    .eq('id', adminId);

  if (error) {
    throw new Error(error.message);
  }
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response('Missing Supabase configuration', { status: 500 });
    }

    const authHeader = req.headers.get('Authorization') ?? '';

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = user.id;

    const [studentRes, agentRes, officialRes, adminRes] = await Promise.all([
      supabase.from('students').select('id').eq('user_id', userId).maybeSingle() as Promise<{ data: MaybeRecord<StudentRecord>; error: any }>,
      supabase.from('agents').select('id').eq('user_id', userId).maybeSingle() as Promise<{ data: MaybeRecord<AgentRecord>; error: any }>,
      supabase.from('university_officials').select('id').eq('user_id', userId).maybeSingle() as Promise<{ data: MaybeRecord<OfficialRecord>; error: any }>,
      supabase.from('administrators').select('id').eq('user_id', userId).maybeSingle() as Promise<{ data: MaybeRecord<AdminRecord>; error: any }>,
    ]);

    if (officialRes.data) {
      return new Response(
        JSON.stringify({ message: 'Account deletion for university officials requires administrator approval.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (studentRes.error) throw studentRes.error;
    if (agentRes.error) throw agentRes.error;
    if (officialRes.error) throw officialRes.error;
    if (adminRes.error) throw adminRes.error;

    if (studentRes.data) {
      await deleteStudentData(supabase, studentRes.data.id);
    }

    if (agentRes.data) {
      await deleteAgentData(supabase, agentRes.data.id);
    }

    if (adminRes.data) {
      await deleteAdministratorData(supabase, adminRes.data.id);
    }

    const { error: userTableError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userTableError) {
      throw new Error(userTableError.message);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      throw new Error(deleteUserError.message);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('delete_account error:', error);
    return new Response(JSON.stringify({ message: error instanceof Error ? error.message : 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
