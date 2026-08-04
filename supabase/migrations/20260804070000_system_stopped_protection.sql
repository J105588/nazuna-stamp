-- System Stopped Protection System Migration
-- Restricts public SELECT access to sections and checkpoints when is_app_stopped is true.
-- Admin users (providing x-admin-passcode in headers) retain full access.

-- 1. Helper function to check if the app is currently stopped
CREATE OR REPLACE FUNCTION is_app_stopped()
RETURNS boolean AS $$
DECLARE
    val text;
BEGIN
    SELECT value::text INTO val FROM stamp_system_settings WHERE key = 'is_app_stopped';
    RETURN (val = 'true' OR val = '1' OR val = '"true"');
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update SELECT RLS Policy for stamp_sections
DROP POLICY IF EXISTS "Public read sections" ON public.stamp_sections;
CREATE POLICY "Public read sections" ON public.stamp_sections
    FOR SELECT USING (
        NOT is_app_stopped() OR
        current_setting('request.headers', true)::json->>'x-admin-passcode' = get_admin_passcode()
    );

-- 3. Update SELECT RLS Policy for stamp_checkpoints
DROP POLICY IF EXISTS "Public read checkpoints" ON public.stamp_checkpoints;
CREATE POLICY "Public read checkpoints" ON public.stamp_checkpoints
    FOR SELECT USING (
        NOT is_app_stopped() OR
        current_setting('request.headers', true)::json->>'x-admin-passcode' = get_admin_passcode()
    );
