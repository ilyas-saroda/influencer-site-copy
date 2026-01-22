-- Location: supabase/migrations/20251225101200_add_creator_insert_policies.sql
-- Schema Analysis: creators table exists with SELECT-only RLS policies
-- Integration Type: modification - adding INSERT/UPDATE/DELETE policies
-- Dependencies: public.creators table

-- Add RLS policies for INSERT, UPDATE, and DELETE operations on creators table
-- This allows authenticated users to create, modify, and delete creator records

-- Allow authenticated users to insert creators
CREATE POLICY "authenticated_users_can_insert_creators"
ON public.creators
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update creators
CREATE POLICY "authenticated_users_can_update_creators"
ON public.creators
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete creators
CREATE POLICY "authenticated_users_can_delete_creators"
ON public.creators
FOR DELETE
TO authenticated
USING (true);

-- Comment explaining the policies
COMMENT ON TABLE public.creators IS 'Creator database with full CRUD access for authenticated users';