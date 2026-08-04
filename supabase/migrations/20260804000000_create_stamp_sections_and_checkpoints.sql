-- Create stamp_sections table
CREATE TABLE IF NOT EXISTS public.stamp_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stamp_checkpoints table with UUID random identifiers (name is omitted/optional)
CREATE TABLE IF NOT EXISTS public.stamp_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name TEXT,
    lat NUMERIC(10, 8) NOT NULL,
    lon NUMERIC(11, 8) NOT NULL,
    section_id UUID REFERENCES public.stamp_sections(id) ON DELETE CASCADE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stamp_system_settings table (Migrated from env vars)
CREATE TABLE IF NOT EXISTS public.stamp_system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for section queries
CREATE INDEX IF NOT EXISTS idx_stamp_checkpoints_section_id ON public.stamp_checkpoints(section_id);

-- Enable RLS
ALTER TABLE public.stamp_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamp_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamp_system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration to prevent ERROR 42710 (policy already exists)
DROP POLICY IF EXISTS "Allow public read access to sections" ON public.stamp_sections;
DROP POLICY IF EXISTS "Allow public read access to checkpoints" ON public.stamp_checkpoints;
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.stamp_system_settings;
DROP POLICY IF EXISTS "Allow admin full access to sections" ON public.stamp_sections;
DROP POLICY IF EXISTS "Allow admin full access to checkpoints" ON public.stamp_checkpoints;
DROP POLICY IF EXISTS "Allow admin full access to settings" ON public.stamp_system_settings;

-- Allow public read access to sections, checkpoints, and settings
CREATE POLICY "Allow public read access to sections" ON public.stamp_sections
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to checkpoints" ON public.stamp_checkpoints
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to settings" ON public.stamp_system_settings
    FOR SELECT USING (true);

-- Allow admin full access
CREATE POLICY "Allow admin full access to sections" ON public.stamp_sections
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin full access to checkpoints" ON public.stamp_checkpoints
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin full access to settings" ON public.stamp_system_settings
    FOR ALL USING (auth.role() = 'authenticated');
