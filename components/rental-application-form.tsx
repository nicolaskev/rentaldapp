"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useWallet } from "@/contexts/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { formatIDR } from "@/lib/currency"

interface RentalApplicationFormProps {
  property: {
    id: string
    title: string
    price_per_month: number
    price_per_month_idr: number
    landlords: {
      name: string
      id: string
    }
  }
  onSubmitSuccess?: () => void
}

export function RentalApplicationForm({ property, onSubmitSuccess }: RentalApplicationFormProps) {
  const { toast } = useToast()
  const { address, isConnected } = useWallet()
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    occupation: "",
    income: 0,
    duration: 12,
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "income" || name === "duration" ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!isConnected || !address) {
      toast({
        title: "Wallet Tidak Terhubung",
        description: "Silakan hubungkan wallet MetaMask Anda terlebih dahulu.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      console.log("[v0] Submitting rental application...")
      const response = await fetch("/api/rental-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_id: property.id,
          tenant_wallet: address,
          tenant_name: formData.name,
          tenant_email: formData.email,
          tenant_phone: formData.phone,
          tenant_address: formData.address,
          tenant_occupation: formData.occupation,
          tenant_income: formData.income,
          duration: formData.duration,
          total_amount: property.price_per_month * formData.duration,
          total_amount_idr: property.price_per_month_idr * formData.duration,
          message: formData.message,
          skipBlockchain: true, // Updated to skip blockchain for now
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Aplikasi Berhasil Dikirim",
          description:
            "Aplikasi sewa Anda telah dikirim ke pemilik properti. Integrasi blockchain akan diaktifkan setelah persetujuan.",
        })

        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          occupation: "",
          income: 0,
          duration: 12,
          message: "",
        })

        if (onSubmitSuccess) {
          onSubmitSuccess()
        }
      } else {
        throw new Error(result.error || "Gagal mengirim aplikasi")
      }
    } catch (error: any) {
      console.error("Error submitting application:", error)
      toast({
        title: "Gagal Mengirim Aplikasi",
        description: error.message || "Terjadi kesalahan saat mengirim aplikasi",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const totalPrice = property.price_per_month_idr * formData.duration

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajukan Sekarang</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                {property.landlords.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">Pemilik: {property.landlords.name}</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap Anda"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan email Anda"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Telepon</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Masukkan nomor telepon Anda"
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Alamat Lengkap</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Masukkan alamat lengkap Anda"
              required
            />
          </div>

          <div>
            <Label htmlFor="occupation">Pekerjaan</Label>
            <Input
              id="occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              placeholder="Masukkan pekerjaan Anda"
              required
            />
          </div>

          <div>
            <Label htmlFor="income">Pendapatan Bulanan</Label>
            <Input
              id="income"
              name="income"
              type="number"
              value={formData.income || ""}
              onChange={handleChange}
              placeholder="Dalam Rupiah"
              required
            />
          </div>

          <div>
            <Label htmlFor="duration">Durasi Sewa (bulan)</Label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value={1}>1 Bulan</option>
              <option value={3}>3 Bulan</option>
              <option value={6}>6 Bulan</option>
              <option value={12}>12 Bulan</option>
              <option value={24}>24 Bulan</option>
              <option value={36}>36 Bulan</option>
            </select>
          </div>

          <div>
            <Label>Total Biaya</Label>
            <div className="flex items-center text-lg font-semibold mt-1 text-green-600">{formatIDR(totalPrice)}</div>
            <p className="text-xs text-muted-foreground">
              {formData.duration} bulan x {formatIDR(property.price_per_month_idr)}/bulan
            </p>
          </div>

          <div>
            <Label htmlFor="message">Pesan (Opsional)</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Ceritakan tentang diri Anda kepada pemilik"
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting || !isConnected}>
            {submitting ? "Mengirim..." : "Kirim Aplikasi"}
          </Button>

          {!isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              Silakan hubungkan wallet MetaMask Anda terlebih dahulu untuk mengajukan aplikasi sewa.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
