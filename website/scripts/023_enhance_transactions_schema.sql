-- Add new columns to wallet_transactions table
alter table public.wallet_transactions
add column if not exists stripe_invoice_id text,
add column if not exists stripe_invoice_pdf_url text,
add column if not exists amount_local decimal(10, 2),
add column if not exists currency_local text,
add column if not exists tax_amount decimal(10, 2),
add column if not exists country text;

-- Update record_wallet_transaction function to accept new parameters
create or replace function public.record_wallet_transaction(
  p_wallet_id uuid,
  p_user_id uuid,
  p_amount decimal,
  p_type text,
  p_category text,
  p_reference_id uuid default null,
  p_reference_type text default null,
  p_description text default null,
  p_metadata jsonb default null,
  p_stripe_invoice_id text default null,
  p_stripe_invoice_pdf_url text default null,
  p_amount_local decimal default null,
  p_currency_local text default null,
  p_tax_amount decimal default null,
  p_country text default null
)
returns uuid as $$
declare
  v_current_balance decimal;
  v_new_balance decimal;
  v_transaction_id uuid;
begin
  -- Get current balance
  select available_balance into v_current_balance
  from public.wallets
  where id = p_wallet_id;

  -- Calculate new balance
  if p_type = 'credit' then
    v_new_balance := v_current_balance + p_amount;
  else
    v_new_balance := v_current_balance - p_amount;
  end if;

  -- Insert transaction record
  insert into public.wallet_transactions (
    wallet_id,
    user_id,
    amount,
    type,
    category,
    reference_id,
    reference_type,
    balance_after,
    description,
    metadata,
    stripe_invoice_id,
    stripe_invoice_pdf_url,
    amount_local,
    currency_local,
    tax_amount,
    country
  ) values (
    p_wallet_id,
    p_user_id,
    p_amount,
    p_type,
    p_category,
    p_reference_id,
    p_reference_type,
    v_new_balance,
    p_description,
    p_metadata,
    p_stripe_invoice_id,
    p_stripe_invoice_pdf_url,
    p_amount_local,
    p_currency_local,
    p_tax_amount,
    p_country
  ) returning id into v_transaction_id;

  -- Update wallet balance
  if p_type = 'credit' then
    update public.wallets
    set 
      available_balance = available_balance + p_amount,
      total_earned = case when p_category in ('post_unlock_earning', 'subscription_earning', 'top_up') then total_earned + p_amount else total_earned end,
      updated_at = now()
    where id = p_wallet_id;
  else
    update public.wallets
    set 
      available_balance = available_balance - p_amount,
      total_withdrawn = case when p_category = 'withdrawal' then total_withdrawn + p_amount else total_withdrawn end,
      updated_at = now()
    where id = p_wallet_id;
  end if;

  return v_transaction_id;
end;
$$ language plpgsql security definer;
