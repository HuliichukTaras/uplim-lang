"use client"

import { useState, useEffect } from "react"
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  WalletIcon,
  Clock,
  TrendingUp,
  Download,
  Settings,
  History,
  Coins,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
import { Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { TopUpDialog } from "@/components/top-up-dialog"
import { WithdrawDialog } from "@/components/wallet/withdraw-dialog"
import { coinsToEur } from "@/lib/wallet"

interface Wallet {
  id: string
  user_id: string
  available_balance: number
  pending_balance: number
  total_earned: number
  total_withdrawn: number
  created_at: string
  coins_balance: number
}

interface Transaction {
  id: string
  wallet_id: string
  user_id: string
  type: string
  category: string
  amount: number
  description: string
  reference_type: string | null
  reference_id: string | null
  balance_after: number
  metadata: any
  created_at: string
}

interface WalletClientProps {
  wallet: Wallet | null
  transactions: Transaction[]
  currentUserId: string
}

export function WalletClient({ wallet, transactions: initialTransactions, currentUserId }: WalletClientProps) {
  const [showTopUpDialog, setShowTopUpDialog] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "income" | "spent" | "withdrawals">("all")
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [currentWallet, setCurrentWallet] = useState<Wallet | null>(wallet)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!currentUserId) return

    const walletChannel = supabase
      .channel("wallet-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wallets",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          setCurrentWallet(payload.new as Wallet)
          router.refresh()
        },
      )
      .subscribe()

    const transactionsChannel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wallet_transactions",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          setTransactions((prev) => [payload.new as Transaction, ...prev])
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(walletChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [currentUserId, supabase, router])

  const coinsBalance = currentWallet?.coins_balance || 0
  const coinsValueEur = coinsToEur(coinsBalance)
  const earnedBalance = currentWallet?.available_balance || 0 // EUR earnings from sales
  const pendingBalance = currentWallet?.pending_balance || 0
  const lifetimeEarnings = currentWallet?.total_earned || 0
  const totalWithdrawn = currentWallet?.total_withdrawn || 0

  const filteredTransactions = transactions.filter((txn) => {
    if (activeTab === "all") return true
    if (activeTab === "income") return txn.type === "credit"
    if (activeTab === "spent") return txn.type === "debit" && txn.category !== "withdrawal"
    if (activeTab === "withdrawals") return txn.category === "withdrawal"
    return true
  })

  const getTransactionIcon = (txn: Transaction) => {
    if (txn.type === "credit") {
      return <ArrowDownLeft className="h-5 w-5 text-green-600" />
    }
    return <ArrowUpRight className="h-5 w-5 text-red-600" />
  }

  const getTransactionAmount = (txn: Transaction) => {
    const prefix = txn.type === "credit" ? "+" : "-"
    // Show coins for coin transactions, EUR for earnings/withdrawals
    if (txn.metadata?.coins_spent || txn.metadata?.coins_received) {
      const coins = txn.metadata?.coins_spent || txn.metadata?.coins_received || txn.metadata?.coins_amount
      return `${prefix}${coins} coins`
    }
    return `${prefix}€${Math.abs(txn.amount).toFixed(2)}`
  }

  const getTransactionColor = (txn: Transaction) => {
    return txn.type === "credit" ? "text-green-600" : "text-red-600"
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 md:p-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground mt-1">Manage your coins and earnings</p>
        </div>
        <Button variant="outline" size="icon" asChild>
          <Link href="/settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Coins Balance Card */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <Coins className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-100 flex items-center gap-2 font-medium">
              <Coins className="w-4 h-4" /> Coins Balance
            </CardDescription>
            <div className="flex items-baseline gap-2 mt-1">
              <CardTitle className="text-4xl font-black tracking-tight">{coinsBalance.toLocaleString()}</CardTitle>
              <span className="text-amber-200 font-bold text-lg">COINS</span>
            </div>
            <p className="text-sm text-amber-100 mt-1">≈ €{coinsValueEur.toFixed(2)} value</p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowTopUpDialog(true)}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-bold border-0 backdrop-blur-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Get More Coins
            </Button>
          </CardContent>
        </Card>

        {/* Earnings Card (for creators) */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <WalletIcon className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-300 flex items-center gap-2 font-medium">
              <TrendingUp className="w-4 h-4" /> Creator Earnings
            </CardDescription>
            <CardTitle className="text-4xl font-black tracking-tight mt-1">€{earnedBalance.toFixed(2)}</CardTitle>
            {pendingBalance > 0 && (
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> €{pendingBalance.toFixed(2)} pending
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowWithdrawDialog(true)}
              disabled={earnedBalance < 10}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-bold border-0 backdrop-blur-sm disabled:opacity-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Withdraw (min €10)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Lifetime Earnings
            </CardDescription>
            <CardTitle className="text-2xl font-bold">€{lifetimeEarnings.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Total Withdrawn</CardDescription>
            <CardTitle className="text-2xl font-bold">€{totalWithdrawn.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transaction History</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions">
              View All <History className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-4">
            {["all", "income", "spent", "withdrawals"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 capitalize"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <Card>
              <CardContent className="p-4">
                {filteredTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <WalletIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No transactions yet</h3>
                    <p className="text-muted-foreground text-sm max-w-xs">Your transaction history will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredTransactions.slice(0, 10).map((txn) => (
                      <div key={txn.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              txn.type === "credit" ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            {getTransactionIcon(txn)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm truncate capitalize">
                                {txn.category?.replace("_", " ") || txn.type}
                              </p>
                              <p className={`font-semibold text-sm ${getTransactionColor(txn)}`}>
                                {getTransactionAmount(txn)}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <p className="truncate max-w-[200px]">{txn.description}</p>
                              <span>{formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <TopUpDialog
        isOpen={showTopUpDialog}
        onClose={() => setShowTopUpDialog(false)}
        onSuccess={() => {
          setShowTopUpDialog(false)
          router.refresh()
        }}
      />

      <WithdrawDialog
        isOpen={showWithdrawDialog}
        onClose={() => setShowWithdrawDialog(false)}
        availableBalance={earnedBalance}
        onSuccess={() => {
          setShowWithdrawDialog(false)
          router.refresh()
        }}
      />
    </div>
  )
}
