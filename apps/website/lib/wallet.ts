export const WALLET_PACKAGES = [10, 25, 50, 100, 200, 500] // EUR
export const COIN_RATE = 10 // 1 EUR = 10 COINS
export const TOP_UP_FEE_PERCENT = 0.1 // 10%
export const PLATFORM_SHARE_PERCENT = 0.2 // 20%
export const AUTHOR_SHARE_PERCENT = 0.8 // 80%

export function eurToCoins(eur: number): number {
  return Math.round(eur * COIN_RATE)
}

export function coinsToEur(coins: number): number {
  return coins / COIN_RATE
}

export function calculateTopUpTotal(packageAmount: number) {
  const fee = packageAmount * TOP_UP_FEE_PERCENT
  const total = packageAmount + fee
  return {
    packageAmount,
    fee,
    total,
    coins: eurToCoins(packageAmount),
  }
}

export function calculateStripeFee(totalAmount: number): number {
  // 2.9% + 0.30 EUR
  return totalAmount * 0.029 + 0.3
}

export function verifyPlatformProfit(packageAmount: number): boolean {
  const { total, fee } = calculateTopUpTotal(packageAmount)
  const stripeFee = calculateStripeFee(total)

  // Profit from Top-Up (Fee - Stripe Cost)
  const topUpProfit = fee - stripeFee

  // Profit from Spending (20% of the package value eventually)
  const spendingProfit = packageAmount * PLATFORM_SHARE_PERCENT

  const totalProfit = topUpProfit + spendingProfit
  const targetProfit = packageAmount * 0.15

  // Ensure we meet the 15% target
  return totalProfit >= targetProfit
}
