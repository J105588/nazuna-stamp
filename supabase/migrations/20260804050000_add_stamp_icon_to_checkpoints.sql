-- Add stamp_icon column to stamp_checkpoints
ALTER TABLE public.stamp_checkpoints
ADD COLUMN IF NOT EXISTS stamp_icon TEXT;
