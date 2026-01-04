"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function SyncTransactionsButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/wallet/sync-transactions", {
        method: "POST",
      })

      if (!res.ok) throw new Error("Sync failed")

      const data = await res.json()

      if (data.synced > 0) {
        toast.success(`Synced ${data.synced} missing transaction(s)`)
        router.refresh()
      } else {
        toast.info("No new transactions found")
      }
    } catch (error) {
      toast.error("Failed to sync transactions")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleSync} disabled={isLoading}>
      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
      Sync Transactions
    </Button>
  )
}
