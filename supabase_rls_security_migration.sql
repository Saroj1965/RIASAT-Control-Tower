-- =================================================================================
-- RIASAT EXECUTIVE DASHBOARD — SHARED LOGIN SUPABASE RLS SECURITY SCRIPT
-- =================================================================================
-- IMPORTANT:
--   1. This script is provided for manual review and execution in the Supabase SQL
--      Editor ONLY after your approval.
--   2. It does NOT delete, alter, or migrate any tables, views, or saved records.
--   3. It restricts database access to the `authenticated` role (users signed in
--      via your single shared Supabase Auth account where `auth.uid() IS NOT NULL`)
--      and revokes unauthenticated (`anon`) access to tables and views.
-- =================================================================================

BEGIN;

-- 1. Revoke unauthenticated (`anon`) table, view, and sequence privileges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Ensure `authenticated` and `service_role` retain full privileges on all tables, views, and sequences
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- 2. Enable Row Level Security on all 11 tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_field_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_form_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workstreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- 3. Drop legacy broad policies (`USING (true)`) that allowed `anon` access
DROP POLICY IF EXISTS "Public Read Departments" ON public.departments;
DROP POLICY IF EXISTS "Public Read All Departments" ON public.departments;
DROP POLICY IF EXISTS "Service Role All Departments" ON public.departments;
DROP POLICY IF EXISTS "Allow All Departments" ON public.departments;
DROP POLICY IF EXISTS "Allow All Users" ON public.users;
DROP POLICY IF EXISTS "Allow All Overview" ON public.department_overview;
DROP POLICY IF EXISTS "Allow All Sections" ON public.form_sections;
DROP POLICY IF EXISTS "Allow All Form Sections" ON public.form_sections;
DROP POLICY IF EXISTS "Allow All Fields" ON public.form_fields;
DROP POLICY IF EXISTS "Allow All Form Fields" ON public.form_fields;
DROP POLICY IF EXISTS "Allow All Field Options" ON public.form_field_options;
DROP POLICY IF EXISTS "Allow All Form Options" ON public.form_field_options;
DROP POLICY IF EXISTS "Allow All Form Values" ON public.department_form_values;
DROP POLICY IF EXISTS "Allow All Workstreams" ON public.workstreams;
DROP POLICY IF EXISTS "Allow All Recruitment" ON public.recruitment;
DROP POLICY IF EXISTS "Allow All Audit Log" ON public.audit_log;
DROP POLICY IF EXISTS "Allow All Login Logs" ON public.login_logs;

-- Drop shared-login policy names if re-running idempotently
DROP POLICY IF EXISTS "Shared Auth Access Departments" ON public.departments;
DROP POLICY IF EXISTS "Shared Auth Access Users" ON public.users;
DROP POLICY IF EXISTS "Shared Auth Access Overview" ON public.department_overview;
DROP POLICY IF EXISTS "Shared Auth Access Form Sections" ON public.form_sections;
DROP POLICY IF EXISTS "Shared Auth Access Form Fields" ON public.form_fields;
DROP POLICY IF EXISTS "Shared Auth Access Form Options" ON public.form_field_options;
DROP POLICY IF EXISTS "Shared Auth Access Form Values" ON public.department_form_values;
DROP POLICY IF EXISTS "Shared Auth Access Workstreams" ON public.workstreams;
DROP POLICY IF EXISTS "Shared Auth Access Recruitment" ON public.recruitment;
DROP POLICY IF EXISTS "Shared Auth Access Audit Log" ON public.audit_log;
DROP POLICY IF EXISTS "Shared Auth Access Login Logs" ON public.login_logs;

-- 4. Create `TO authenticated` RLS policies requiring a valid Supabase Auth session (`auth.uid() IS NOT NULL`)
CREATE POLICY "Shared Auth Access Departments"
  ON public.departments FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shared Auth Access Users"
  ON public.users FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shared Auth Access Overview"
  ON public.department_overview FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shared Auth Access Form Sections"
  ON public.form_sections FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shared Auth Access Form Fields"
  ON public.form_fields FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shared Auth Access Form Options"
  ON public.form_field_options FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shared Auth Access Form Values"
  ON public.department_form_values FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shared Auth Access Workstreams"
  ON public.workstreams FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shared Auth Access Recruitment"
  ON public.recruitment FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shared Auth Access Audit Log"
  ON public.audit_log FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shared Auth Access Login Logs"
  ON public.login_logs FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;
