-- Allow duplicate qr_id across multiple checkpoints so that the same QR code can be shared across multiple stamp rally sections/areas.
ALTER TABLE stamp_checkpoints DROP CONSTRAINT IF EXISTS stamp_checkpoints_qr_id_key;
DROP INDEX IF EXISTS stamp_checkpoints_qr_id_key;
