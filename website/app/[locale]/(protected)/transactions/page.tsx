import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ArrowUpRight, ArrowDownLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { SyncTransactionsButton } from "@/components/wallet/sync-transactions-button"

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: transactions } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: { label: "Completed", className: "bg-green-500" },
      pending: { label: "Pending", className: "bg-yellow-500" },
      failed: { label: "Failed", className: "bg-red-500" },
    }
    const config = variants[status] || variants.completed
    return <Badge className={config.className}>{config.label}</Badge>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-gray-600">View all your payments and earnings</p>
        </div>
        <SyncTransactionsButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{format(new Date(tx.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tx.type === "credit" ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className="capitalize">{tx.category.replace("_", " ")}</span>
                    </div>
                  </TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className={tx.type === "credit" ? "text-green-600 font-medium" : "text-red-600"}>
                    {tx.type === "credit" ? "+" : "-"}€{Number(tx.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(tx.status || "completed")}</TableCell>
                  <TableCell>
                    {tx.metadata?.stripe_invoice_pdf_url || tx.metadata?.invoice_pdf ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Link href={tx.metadata.stripe_invoice_pdf_url || tx.metadata.invoice_pdf} target="_blank">
                          <Download className="w-4 h-4 mr-2" />
                          Invoice PDF
                        </Link>
                      </Button>
                    ) : tx.metadata?.receipt_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Link href={tx.metadata.receipt_url} target="_blank">
                          <Download className="w-4 h-4 mr-2" />
                          Receipt
                        </Link>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {(!transactions || transactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
