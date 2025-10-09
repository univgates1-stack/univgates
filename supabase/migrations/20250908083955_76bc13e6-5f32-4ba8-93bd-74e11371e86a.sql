-- Add remaining RLS policies for tables without policies

-- Conversations table policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations for their applications"
ON public.conversations
FOR SELECT
USING (
  application_id IN (
    SELECT id FROM applications WHERE student_id = auth.uid()
  )
);

-- Permissions table policies
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permissions are viewable by authenticated users"
ON public.permissions
FOR SELECT
TO authenticated
USING (true);

-- Roles table policies  
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles are viewable by authenticated users"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- Role permissions table policies
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Role permissions are viewable by authenticated users"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- User roles table policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Translatable strings table policies
ALTER TABLE public.translatable_strings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Translatable strings are viewable by everyone"
ON public.translatable_strings
FOR SELECT
USING (true);

-- Translations table policies
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Translations are viewable by everyone"
ON public.translations
FOR SELECT
USING (true);