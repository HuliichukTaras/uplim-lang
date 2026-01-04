-- Add stripe_customer_id to billing_profiles
alter table public.billing_profiles 
add column if not exists stripe_customer_id text unique;

-- Create index
create index if not exists idx_billing_profiles_stripe_customer_id on public.billing_profiles(stripe_customer_id);
