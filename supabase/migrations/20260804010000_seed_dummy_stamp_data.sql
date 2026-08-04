-- ====================================================================
-- SEED DATA MIGRATION FOR STAMP RALLY SYSTEM
-- File: 20260804010000_seed_dummy_stamp_data.sql
-- ====================================================================

-- 1. Insert/Update Default System Settings
INSERT INTO public.stamp_system_settings (key, value) VALUES
    ('is_app_stopped', 'false'::jsonb),
    ('staff_passcode', '"1234"'::jsonb),
    ('admin_passcode', '"9999"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Insert/Update Sample Station Sections
INSERT INTO public.stamp_sections (id, name, description, display_order) VALUES
    ('a1111111-1111-4000-8000-111111111111', '市川真間駅エリア', '市川真間駅周辺のスタンプスポット', 1),
    ('a2222222-2222-4000-8000-222222222222', '国府台駅エリア', '国府台駅周辺のスタンプスポット', 2)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- 3. Insert/Update Sample Stamp Checkpoints with UUID Identifiers and Coordinates (No stamp names)
INSERT INTO public.stamp_checkpoints (id, qr_id, lat, lon, section_id, display_order) VALUES
    ('c1111111-1111-4000-8000-111111111111', 'c1111111-1111-4000-8000-111111111111', 35.67743995, 139.83894255, 'a1111111-1111-4000-8000-111111111111', 1),
    ('c2222222-2222-4000-8000-222222222222', 'c2222222-2222-4000-8000-222222222222', 35.67650000, 139.84200000, 'a1111111-1111-4000-8000-111111111111', 2),
    ('c3333333-3333-4000-8000-333333333333', 'c3333333-3333-4000-8000-333333333333', 35.66602359, 139.85876273, 'a2222222-2222-4000-8000-222222222222', 1),
    ('c4444444-4444-4000-8000-444444444444', 'c4444444-4444-4000-8000-444444444444', 35.66900000, 139.85500000, 'a2222222-2222-4000-8000-222222222222', 2)
ON CONFLICT (id) DO UPDATE SET 
    qr_id = EXCLUDED.qr_id,
    lat = EXCLUDED.lat,
    lon = EXCLUDED.lon,
    section_id = EXCLUDED.section_id,
    display_order = EXCLUDED.display_order;
