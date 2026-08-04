-- Migration: Fix JSONB Passcode Extraction in RLS and RPC Functions
-- Handles string quotes and numeric types safely when comparing passcodes in JSONB columns.

CREATE OR REPLACE FUNCTION get_admin_passcode()
RETURNS text AS $$
DECLARE
    pass text;
BEGIN
    SELECT trim(both '"' from value::text) INTO pass 
    FROM stamp_system_settings 
    WHERE key = 'admin_passcode';
    RETURN pass;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_staff_passcode()
RETURNS text AS $$
DECLARE
    pass text;
BEGIN
    SELECT trim(both '"' from value::text) INTO pass 
    FROM stamp_system_settings 
    WHERE key = 'staff_passcode';
    
    RETURN pass;    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_passcode(p_passcode text, p_type text)
RETURNS boolean AS $$
DECLARE
    real_pass text;
BEGIN
    SELECT trim(both '"' from value::text) INTO real_pass 
    FROM stamp_system_settings 
    WHERE key = p_type || '_passcode';
    
    RETURN p_passcode = real_pass;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
