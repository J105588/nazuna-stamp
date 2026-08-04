-- Drop existing policies that restrict access to authenticated users only
DROP POLICY IF EXISTS "Allow admin full access to sections" ON public.stamp_sections;
DROP POLICY IF EXISTS "Allow admin full access to checkpoints" ON public.stamp_checkpoints;
DROP POLICY IF EXISTS "Allow admin full access to settings" ON public.stamp_system_settings;

-- Create policies to allow all users (including anon) full access
-- Since the frontend handles authentication via passcode, we allow DB operations directly.
CREATE POLICY "Allow public full access to sections" ON public.stamp_sections
    FOR ALL USING (true);

CREATE POLICY "Allow public full access to checkpoints" ON public.stamp_checkpoints
    FOR ALL USING (true);

CREATE POLICY "Allow public full access to settings" ON public.stamp_system_settings
    FOR ALL USING (true);
