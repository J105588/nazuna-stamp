-- Drop previous overly permissive policies
DROP POLICY IF EXISTS "Allow public full access to sections" ON public.stamp_sections;
DROP POLICY IF EXISTS "Allow public full access to checkpoints" ON public.stamp_checkpoints;
DROP POLICY IF EXISTS "Allow public full access to settings" ON public.stamp_system_settings;

-- 1. Create SECURITY DEFINER functions to securely fetch passcodes bypassing RLS
CREATE OR REPLACE FUNCTION get_admin_passcode()
RETURNS text AS $$
DECLARE
    pass text;
BEGIN
    SELECT value INTO pass FROM stamp_system_settings WHERE key = 'admin_passcode';
    RETURN pass;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_staff_passcode()
RETURNS text AS $$
DECLARE
    pass text;
BEGIN
    SELECT value INTO pass FROM stamp_system_settings WHERE key = 'staff_passcode';
    RETURN pass;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create RPC for client-side passcode verification
CREATE OR REPLACE FUNCTION verify_passcode(p_passcode text, p_type text)
RETURNS boolean AS $$
DECLARE
    real_pass text;
BEGIN
    SELECT value INTO real_pass FROM stamp_system_settings WHERE key = p_type || '_passcode';
    RETURN p_passcode = real_pass;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Setup Secure RLS Policies

-- For stamp_system_settings:
-- Public can only read non-sensitive settings (like is_app_stopped)
DROP POLICY IF EXISTS "Public read non-sensitive settings" ON public.stamp_system_settings;
CREATE POLICY "Public read non-sensitive settings" ON public.stamp_system_settings
    FOR SELECT USING (
        key NOT IN ('admin_passcode', 'staff_passcode')
    );

-- Admin can read/write everything if they provide the correct passcode in the header
DROP POLICY IF EXISTS "Admin full access to settings" ON public.stamp_system_settings;
CREATE POLICY "Admin full access to settings" ON public.stamp_system_settings
    FOR ALL USING (
        current_setting('request.headers', true)::json->>'x-admin-passcode' = get_admin_passcode()
    );

-- For stamp_sections:
-- Public can read all sections
DROP POLICY IF EXISTS "Public read sections" ON public.stamp_sections;
CREATE POLICY "Public read sections" ON public.stamp_sections
    FOR SELECT USING (true);

-- Admin can insert/update/delete sections
DROP POLICY IF EXISTS "Admin write sections" ON public.stamp_sections;
CREATE POLICY "Admin write sections" ON public.stamp_sections
    FOR INSERT WITH CHECK (
        current_setting('request.headers', true)::json->>'x-admin-passcode' = get_admin_passcode()
    );

DROP POLICY IF EXISTS "Admin update sections" ON public.stamp_sections;
CREATE POLICY "Admin update sections" ON public.stamp_sections
    FOR UPDATE USING (
        current_setting('request.headers', true)::json->>'x-admin-passcode' = get_admin_passcode()
    );

DROP POLICY IF EXISTS "Admin delete sections" ON public.stamp_sections;
CREATE POLICY "Admin delete sections" ON public.stamp_sections
    FOR DELETE USING (
        current_setting('request.headers', true)::json->>'x-admin-passcode' = get_admin_passcode()
    );

-- For stamp_checkpoints:
-- Public can read all checkpoints
DROP POLICY IF EXISTS "Public read checkpoints" ON public.stamp_checkpoints;
CREATE POLICY "Public read checkpoints" ON public.stamp_checkpoints
    FOR SELECT USING (true);

-- Admin can insert/update/delete checkpoints
DROP POLICY IF EXISTS "Admin write checkpoints" ON public.stamp_checkpoints;
CREATE POLICY "Admin write checkpoints" ON public.stamp_checkpoints
    FOR INSERT WITH CHECK (
        current_setting('request.headers', true)::json->>'x-admin-passcode' = get_admin_passcode()
    );

DROP POLICY IF EXISTS "Admin update checkpoints" ON public.stamp_checkpoints;
CREATE POLICY "Admin update checkpoints" ON public.stamp_checkpoints
    FOR UPDATE USING (
        current_setting('request.headers', true)::json->>'x-admin-passcode' = get_admin_passcode()
    );

DROP POLICY IF EXISTS "Admin delete checkpoints" ON public.stamp_checkpoints;
CREATE POLICY "Admin delete checkpoints" ON public.stamp_checkpoints
    FOR DELETE USING (
        current_setting('request.headers', true)::json->>'x-admin-passcode' = get_admin_passcode()
    );
