-- Drop the old version of record_wallet_transaction to avoid function overloading ambiguity
-- The new version in 023_enhance_transactions_schema.sql has additional parameters for invoice data

drop function if exists public.record_wallet_transaction(
  uuid, uuid, numeric, text, text, uuid, text, text, jsonb
);

-- Keep only the enhanced version with invoice parameters
-- This resolves the "Could not choose the best candidate function" error
