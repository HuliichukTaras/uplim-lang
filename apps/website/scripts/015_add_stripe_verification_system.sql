-- Add verification tracking tables for Stripe Connect KYC/KYB

-- Creator verification status table
CREATE TABLE IF NOT EXISTS creator_verification_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_account_id text,
  
  -- Verification statuses
  identity_verified boolean DEFAULT false,
  tax_verified boolean DEFAULT false,
  payouts_enabled boolean DEFAULT false,
  charges_enabled boolean DEFAULT false,
  
  -- Requirements tracking
  currently_due jsonb DEFAULT '[]'::jsonb,
  eventually_due jsonb DEFAULT '[]'::jsonb,
  past_due jsonb DEFAULT '[]'::jsonb,
  pending_verification jsonb DEFAULT '[]'::jsonb,
  disabled_reason text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_sync_at timestamp with time zone,
  verified_at timestamp with time zone,
  
  UNIQUE(stripe_account_id)
);

-- Enable RLS
ALTER TABLE creator_verification_status ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "creator_verification_select_own" 
  ON creator_verification_status FOR SELECT 
  USING (auth.uid() = creator_id);

CREATE POLICY "creator_verification_insert_own" 
  ON creator_verification_status FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "creator_verification_update_own" 
  ON creator_verification_status FOR UPDATE 
  USING (auth.uid() = creator_id);

-- Function to check if creator can withdraw
CREATE OR REPLACE FUNCTION can_creator_withdraw(p_creator_id uuid)
RETURNS boolean AS $$
DECLARE
  v_followers_count integer;
  v_verification_status record;
BEGIN
  -- Get followers count
  SELECT COUNT(*) INTO v_followers_count
  FROM follows
  WHERE following_id = p_creator_id;
  
  -- Get verification status
  SELECT * INTO v_verification_status
  FROM creator_verification_status
  WHERE creator_id = p_creator_id;
  
  -- Check all conditions
  RETURN (
    v_followers_count >= 2500 AND
    v_verification_status.identity_verified = true AND
    v_verification_status.tax_verified = true AND
    v_verification_status.payouts_enabled = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync Stripe account status
CREATE OR REPLACE FUNCTION sync_stripe_account_status(
  p_creator_id uuid,
  p_stripe_account_id text,
  p_payouts_enabled boolean,
  p_charges_enabled boolean,
  p_requirements jsonb,
  p_disabled_reason text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_identity_verified boolean;
  v_tax_verified boolean;
BEGIN
  -- Determine if identity and tax are verified based on requirements
  v_identity_verified := (
    p_requirements->>'currently_due' IS NULL OR 
    p_requirements->>'currently_due' = '[]' OR
    (p_requirements->>'currently_due')::jsonb @> '["individual.verification.document"]'::jsonb = false
  ) AND p_payouts_enabled;
  
  v_tax_verified := (
    p_requirements->>'currently_due' IS NULL OR 
    p_requirements->>'currently_due' = '[]' OR
    (p_requirements->>'currently_due')::jsonb @> '["individual.id_number"]'::jsonb = false
  ) AND p_payouts_enabled;
  
  -- Insert or update verification status
  INSERT INTO creator_verification_status (
    creator_id,
    stripe_account_id,
    identity_verified,
    tax_verified,
    payouts_enabled,
    charges_enabled,
    currently_due,
    eventually_due,
    past_due,
    pending_verification,
    disabled_reason,
    last_sync_at,
    updated_at,
    verified_at
  ) VALUES (
    p_creator_id,
    p_stripe_account_id,
    v_identity_verified,
    v_tax_verified,
    p_payouts_enabled,
    p_charges_enabled,
    COALESCE(p_requirements->'currently_due', '[]'::jsonb),
    COALESCE(p_requirements->'eventually_due', '[]'::jsonb),
    COALESCE(p_requirements->'past_due', '[]'::jsonb),
    COALESCE(p_requirements->'pending_verification', '[]'::jsonb),
    p_disabled_reason,
    now(),
    now(),
    CASE WHEN v_identity_verified AND v_tax_verified THEN now() ELSE NULL END
  )
  ON CONFLICT (creator_id) DO UPDATE SET
    stripe_account_id = EXCLUDED.stripe_account_id,
    identity_verified = EXCLUDED.identity_verified,
    tax_verified = EXCLUDED.tax_verified,
    payouts_enabled = EXCLUDED.payouts_enabled,
    charges_enabled = EXCLUDED.charges_enabled,
    currently_due = EXCLUDED.currently_due,
    eventually_due = EXCLUDED.eventually_due,
    past_due = EXCLUDED.past_due,
    pending_verification = EXCLUDED.pending_verification,
    disabled_reason = EXCLUDED.disabled_reason,
    last_sync_at = now(),
    updated_at = now(),
    verified_at = CASE 
      WHEN EXCLUDED.identity_verified AND EXCLUDED.tax_verified AND creator_verification_status.verified_at IS NULL 
      THEN now() 
      ELSE creator_verification_status.verified_at 
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes
CREATE INDEX idx_creator_verification_creator_id ON creator_verification_status(creator_id);
CREATE INDEX idx_creator_verification_stripe_account ON creator_verification_status(stripe_account_id);
CREATE INDEX idx_creator_verification_status ON creator_verification_status(identity_verified, tax_verified, payouts_enabled);

COMMENT ON TABLE creator_verification_status IS 'Tracks Stripe Connect account verification status for creators';
COMMENT ON FUNCTION can_creator_withdraw IS 'Checks if creator meets all requirements to withdraw funds';
COMMENT ON FUNCTION sync_stripe_account_status IS 'Syncs Stripe account verification status from webhooks';
