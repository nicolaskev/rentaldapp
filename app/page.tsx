"use client"

import { useState, useEffect } from "react"
import { PropertyCard } from "@/components/property-card"
import { WalletConnect } from "@/components/wallet-connect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Home, Filter, RefreshCw, AlertCircle, User } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { PropertyApiResponse } from "@/lib/types"

export default function HomePage() {
  const [properties, setProperties] = useState<PropertyApiResponse[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isConnected } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Loading properties...")

      const response = await fetch("/api/properties", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Disable caching
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response headers:", response.headers.get("content-type"))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ HTTP Error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("❌ Non-JSON response:", responseText)
        throw new Error("Server returned non-JSON response")
      }

      const result = await response.json()
      console.log("📊 API Response:", result)

      if (result.success && Array.isArray(result.data)) {
        setProperties(result.data)
        console.log("✅ Properties loaded:", result.data.length)

        if (result.data.length === 0) {
          setError("Tidak ada properti yang tersedia saat ini")
        }
      } else {
        console.error("❌ Invalid response format:", result)
        setError(result.error || "Invalid response format")
        setProperties([])
      }
    } catch (error: any) {
      console.error("❌ Error loading properties:", error)
      setError(error.message || "Failed to load properties")
      setProperties([])

      toast({
        title: "Error",
        description: error.message || "Failed to load properties",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProperties = properties.filter(
    (property) =>
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.property_type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <h1 className="text-xl font-bold">RentChain</h1>
          </div>
          <div className="flex items-center gap-4">
            {isConnected && (
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Riwayat
                </Button>
              </Link>
            )}
            <Link href="/landlord/login">
              <Button variant="outline">Landlord Login</Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Platform Sewa Properti Terdesentralisasi</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sewa properti dengan aman menggunakan teknologi blockchain. Hubungkan wallet MetaMask Anda untuk memulai.
          </p>
          {!isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-yellow-800">
                Hubungkan wallet MetaMask Anda untuk melihat detail properti dan mengajukan aplikasi sewa.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari properti berdasarkan judul atau tipe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Properti Tersedia</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                {filteredProperties.length} dari {properties.length} properti
              </div>
              <Button variant="outline" size="sm" onClick={loadProperties} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-800">Error Loading Properties</h4>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={loadProperties} className="mt-3 bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-video rounded-t-lg"></div>
                  <div className="bg-white p-4 rounded-b-lg border border-t-0">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "Tidak ada properti yang ditemukan" : "Belum ada properti tersedia"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "Coba ubah kata kunci pencarian Anda atau hapus filter."
                    : "Properti akan muncul di sini setelah landlord menambahkan listing."}
                </p>
                {searchTerm ? (
                  <Button onClick={() => setSearchTerm("")} variant="outline">
                    Hapus Pencarian
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button onClick={loadProperties} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
