"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, CreditCard, Clock, CheckCircle, ExternalLink, Wallet } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface LeaseAgreement {
  id: string
  application_id: string
  tenant_wallet: string
  lease_start_date: string
  lease_end_date: string
  monthly_rent: number
  monthly_rent_idr: number
  security_deposit: number
  security_deposit_idr: number
  terms_and_conditions: string
  status: string
  approved_at?: string
  created_at: string
  rental_applications: {
    id: string
    tenant_name: string
    tenant_email: string
    tenant_phone: string
    duration: number
    total_amount: number
    total_amount_idr: number
    is_paid: boolean
    properties: {
      id: string
      title: string
      location: string
      price_per_month_eth: number
    }
  }
}

interface Transaction {
  id: string
  application_id: string
  tenant_wallet: string
  amount_eth: number
  amount_idr: number
  transaction_hash: string
  payment_type: string
  created_at: string
  rental_applications: {
    tenant_name: string
    properties: {
      title: string
      location: string
    }
  }
}

export default function UserDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { address, isConnected } = useWallet()
  const [leaseAgreements, setLeaseAgreements] = useState<LeaseAgreement[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isConnected && address) {
      loadUserData()
    } else {
      setLoading(false)
    }
  }, [isConnected, address])

  const loadUserData = async () => {
    if (!address) return

    try {
      // Load lease agreements
      const leaseResponse = await fetch(`/api/lease-agreements?tenant_wallet=${address}`)
      const leaseResult = await leaseResponse.json()

      if (leaseResult.success) {
        setLeaseAgreements(leaseResult.data || [])
      }

      // Load transactions
      const transactionResponse = await fetch(`/api/transactions?tenant_wallet=${address}`)
      const transactionResult = await transactionResponse.json()

      if (transactionResult.success) {
        setTransactions(transactionResult.data || [])
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatETH = (amount: number) => {
    return `${amount.toFixed(4)} ETH`
  }

  const handlePayment = (applicationId: string) => {
    router.push(`/payment/${applicationId}`)
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Wallet Tidak Terhubung</h1>
          <p className="text-muted-foreground mb-6">Silakan hubungkan MetaMask wallet Anda untuk melihat dashboard.</p>
          <Link href="/">
            <Button>Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const approvedLeases = leaseAgreements.filter((lease) => lease.status === "approved")
  const pendingLeases = leaseAgreements.filter((lease) => lease.status === "pending")
  const paidLeases = leaseAgreements.filter((lease) => lease.rental_applications.is_paid)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <h1 className="text-xl font-bold">Halaman Penyewa</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
            <Link href="/">
              <Button variant="outline" size="sm">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kontrak</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaseAgreements.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Pembayaran</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {approvedLeases.filter((lease) => !lease.rental_applications.is_paid).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sewa Aktif</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidLeases.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="lease-agreements" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lease-agreements">Kontrak Sewa</TabsTrigger>
            <TabsTrigger value="transactions">Riwayat Pembayaran</TabsTrigger>
          </TabsList>

          <TabsContent value="lease-agreements" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Kontrak Sewa Anda</h2>
            </div>

            {leaseAgreements.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada kontrak sewa.</p>
                  <Link href="/">
                    <Button className="mt-4">Cari Properti</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {leaseAgreements.map((lease) => (
                  <Card key={lease.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{lease.rental_applications?.properties?.title}</h3>
                            <Badge
                              variant={
                                lease.rental_applications.is_paid
                                  ? "default"
                                  : lease.status === "approved"
                                    ? "secondary"
                                    : lease.status === "rejected"
                                      ? "destructive"
                                      : "outline"
                              }
                              className={lease.rental_applications.is_paid ? "bg-green-500" : ""}
                            >
                              {lease.rental_applications.is_paid
                                ? "Dibayar"
                                : lease.status === "approved"
                                  ? "Siap Bayar"
                                  : lease.status === "rejected"
                                    ? "Ditolak"
                                    : "Menunggu Persetujuan"}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {lease.rental_applications?.properties?.location}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <strong>Durasi:</strong> {lease.rental_applications?.duration} bulan
                            </div>
                            <div>
                              <strong>Sewa Bulanan:</strong> {formatIDR(lease.monthly_rent_idr)}
                            </div>
                            <div>
                              <strong>Total:</strong> {formatIDR(lease.rental_applications?.total_amount_idr)}
                            </div>
                            <div>
                              <strong>Harga ETH:</strong>{" "}
                              {formatETH(lease.rental_applications?.properties?.price_per_month_eth || 0)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <strong>Mulai:</strong> {new Date(lease.lease_start_date).toLocaleDateString("id-ID")}
                            </div>
                            <div>
                              <strong>Berakhir:</strong> {new Date(lease.lease_end_date).toLocaleDateString("id-ID")}
                            </div>
                          </div>

                          {lease.approved_at && (
                            <div className="text-sm text-green-600">
                              <strong>Disetujui pada:</strong> {new Date(lease.approved_at).toLocaleDateString("id-ID")}
                            </div>
                          )}
                        </div>

                        {lease.status === "approved" && !lease.rental_applications.is_paid && (
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handlePayment(lease.application_id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Bayar Sekarang
                            </Button>
                          </div>
                        )}

                        {lease.status === "rejected" && (
                          <div className="flex items-center gap-2 ml-4">
                            <Link href="/">
                              <Button size="sm" variant="outline">
                                Cari Properti Lain
                              </Button>
                            </Link>
                          </div>
                        )}

                        {lease.rental_applications.is_paid && (
                          <div className="flex items-center gap-2 ml-4">
                            <Link href="/">
                              <Button size="sm" variant="outline">
                                Sewa Properti Lain
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <h2 className="text-2xl font-bold">Riwayat Pembayaran</h2>

            {transactions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada transaksi pembayaran.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{transaction.rental_applications?.properties?.title}</h3>
                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              <strong>Jumlah:</strong> {formatETH(transaction.amount_eth)}
                            </span>
                            <span>
                              <strong>Setara:</strong> {formatIDR(transaction.amount_idr)}
                            </span>
                            <span>
                              <strong>Tipe:</strong> {transaction.payment_type}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Lokasi: {transaction.rental_applications?.properties?.location}</p>
                            <p>Tanggal: {new Date(transaction.created_at).toLocaleDateString("id-ID")}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="bg-green-500">
                            Berhasil
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            <a
                              href={`https://sepolia.etherscan.io/tx/${transaction.transaction_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Lihat di Etherscan
                            </a>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
