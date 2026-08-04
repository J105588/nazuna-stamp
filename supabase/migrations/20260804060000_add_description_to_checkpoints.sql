-- Add description column to stamp_checkpoints
ALTER TABLE public.stamp_checkpoints
ADD COLUMN IF NOT EXISTS description TEXT;
