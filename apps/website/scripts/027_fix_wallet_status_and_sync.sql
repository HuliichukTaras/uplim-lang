-- 1. Add status column to wallet_transactions if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'wallet_transactions' and column_name = 'status') then
    alter table public.wallet_transactions add column status text default 'completed' check (status in ('pending', 'completed', 'failed'));
  end if;
end $$;

-- 2. Update the record_wallet_transaction function to handle status
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
  p_country text default null,
  p_status text default 'completed'
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

  -- Calculate new balance for the transaction record (snapshot)
  -- Note: This snapshot assumes completion. Real-time balance is queried from wallets table.
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
    country,
    status
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
    p_country,
    p_status
  ) returning id into v_transaction_id;

  -- Update wallet balance ONLY if completed
  if p_status = 'completed' then
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
  elsif p_status = 'pending' then
    -- Update pending balance logic could go here if we separated pending_balance in a useful way
    -- For now, we just record it without affecting available_balance
    update public.wallets
    set pending_balance = pending_balance + p_amount,
        updated_at = now()
    where id = p_wallet_id;
  end if;

  return v_transaction_id;
end;
$$ language plpgsql security definer;
