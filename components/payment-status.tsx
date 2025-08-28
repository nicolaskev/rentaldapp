"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react"

interface PaymentStatusProps {
  status: "pending" | "processing" | "completed" | "failed"
  transactionHash?: string
  amount?: string
  currency?: string
}

export function PaymentStatus({ status, transactionHash, amount, currency = "ETH" }: PaymentStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          badge: "default" as const,
          title: "Pembayaran Berhasil",
          description: "Transaksi telah dikonfirmasi di blockchain",
        }
      case "processing":
        return {
          icon: Clock,
          color: "text-blue-500",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          badge: "secondary" as const,
          title: "Memproses Pembayaran",
          description: "Menunggu konfirmasi dari jaringan Sepolia",
        }
      case "failed":
        return {
          icon: AlertCircle,
          color: "text-red-500",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          badge: "destructive" as const,
          title: "Pembayaran Gagal",
          description: "Terjadi kesalahan saat memproses transaksi",
        }
      default:
        return {
          icon: Clock,
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          badge: "secondary" as const,
          title: "Menunggu Pembayaran",
          description: "Silakan lanjutkan dengan pembayaran",
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.color}`} />
          {config.title}
          <Badge variant={config.badge}>{status.toUpperCase()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{config.description}</p>

        {amount && (
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Jumlah:</span>
            <span className="font-mono">
              {amount} {currency}
            </span>
          </div>
        )}

        {transactionHash && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Transaction Hash:</span>
            </div>
            <div className="bg-white p-2 rounded border">
              <code className="text-xs break-all">{transactionHash}</code>
            </div>
            <a
              href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
              Lihat di Sepolia Etherscan
            </a>
          </div>
        )}

        {status === "processing" && (
          <div className="bg-blue-100 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tips:</strong> Transaksi biasanya dikonfirmasi dalam 1-2 menit di Sepolia testnet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
