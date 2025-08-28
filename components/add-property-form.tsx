"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Upload, X } from "lucide-react"
import type { PropertyFormData } from "@/lib/types"

type ImageKey = "image_1" | "image_2" | "image_3"

interface AddPropertyFormProps {
  landlordId: string
  onSuccess: () => void
  onCancel: () => void
}

export function AddPropertyForm({ landlordId, onSuccess, onCancel }: AddPropertyFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    price_per_month_idr: 0,
    property_type: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    area_sqm: 50,
    furnished: false,
    facilities: [],
    rental_terms: {
      deposit_keamanan: "1x sewa bulanan",
      deposit_hewan: "0.5x sewa bulanan",
      jangka_waktu: "12-36 bulan",
      utilitas: "Tanggung jawab penyewa",
      aturan_khusus: "",
    },
  })

  const [images, setImages] = useState({
    image_1: "",
    image_2: "",
    image_3: "",
  })
  const [imageFiles, setImageFiles] = useState<{ [key: string]: File | null }>({
    image_1: null,
    image_2: null,
    image_3: null,
  })

  const generateFixedEthPrice = (title: string, priceIdr: number): number => {
    // Create a hash from title and price to ensure consistent pricing
    let hash = 0
    const input = title + priceIdr.toString()
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }

    // Use hash to generate price between 0.001 and 0.015 ETH
    const normalizedHash = Math.abs(hash) / 2147483647 // Normalize to 0-1
    const ethPrice = 0.001 + normalizedHash * 0.014 // 0.001 to 0.015 ETH range

    return Number(ethPrice.toFixed(6)) // Round to 6 decimal places for consistency
  }

  const handleFileUpload = (imageKey: ImageKey, file: File): void => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        setImages((prev) => ({
          ...prev,
          [imageKey]: e.target?.result as string,
        }))
        setImageFiles((prev) => ({
          ...prev,
          [imageKey]: file,
        }))
      }
      reader.readAsDataURL(file)
    } else {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      })
    }
  }

  const handleImageUrlChange = (imageKey: ImageKey, url: string): void => {
    setImages((prev) => ({
      ...prev,
      [imageKey]: url,
    }))
    setImageFiles((prev) => ({
      ...prev,
      [imageKey]: null,
    }))
  }

  const removeImage = (imageKey: ImageKey): void => {
    setImages((prev) => ({
      ...prev,
      [imageKey]: "",
    }))
    setImageFiles((prev) => ({
      ...prev,
      [imageKey]: null,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setLoading(true)

    try {
      const fixedEthPrice = generateFixedEthPrice(formData.title, formData.price_per_month_idr)

      const propertyData = {
        landlord_id: landlordId,
        title: formData.title,
        description: formData.description,
        price_per_month: Math.floor(formData.price_per_month_idr / 15000), // Rough USD conversion
        price_per_month_idr: formData.price_per_month_idr,
        price_per_month_eth: fixedEthPrice,
        image_1: images.image_1 || `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(formData.title)}`,
        image_2: images.image_2 || null,
        image_3: images.image_3 || null,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area_sqm: formData.area_sqm,
        furnished: formData.furnished,
        facilities: formData.facilities,
        rental_terms: formData.rental_terms,
        skipBlockchain: true,
      }

      console.log("[v0] Creating property in database first...")
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(propertyData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Properti Berhasil Ditambahkan",
          description:
            "Properti telah disimpan ke database. Untuk integrasi blockchain penuh, hubungkan wallet dan deploy ulang.",
        })
        onSuccess()
      } else {
        throw new Error(result.error || "Failed to create property")
      }
    } catch (error: any) {
      console.error("Error creating property:", error)
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan properti",
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

  const previewEthPrice =
    formData.title && formData.price_per_month_idr > 0
      ? generateFixedEthPrice(formData.title, formData.price_per_month_idr)
      : 0

  const ImageUploadSection = ({
    imageKey,
    label,
  }: {
    imageKey: ImageKey
    label: string
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {images[imageKey] ? (
        <div className="relative">
          <img
            src={images[imageKey] || "/placeholder.svg"}
            alt={`Preview ${label}`}
            className="w-full h-32 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => removeImage(imageKey)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="url"
                placeholder="Masukkan URL gambar..."
                onChange={(e) => handleImageUrlChange(imageKey, e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground flex items-center">atau</div>
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(imageKey, file)
                }}
                className="hidden"
                id={`file-${imageKey}`}
              />
              <Label htmlFor={`file-${imageKey}`} className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </span>
                </Button>
              </Label>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const addFacility = (facility: string): void => {
    if (facility.trim() && !formData.facilities.includes(facility.trim())) {
      setFormData((prev) => ({
        ...prev,
        facilities: [...prev.facilities, facility.trim()],
      }))
    }
  }

  const removeFacility = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== index),
    }))
  }

  const updateRentalTerm = (key: string, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      rental_terms: {
        ...prev.rental_terms,
        [key]: value,
      },
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="title">Judul Properti *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Apartemen Modern Jakarta Pusat"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Deskripsi *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Deskripsi lengkap tentang properti, fasilitas, dan keunggulannya..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Gambar Properti</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ImageUploadSection imageKey="image_1" label="Gambar Utama *" />
          <ImageUploadSection imageKey="image_2" label="Gambar 2" />
          <ImageUploadSection imageKey="image_3" label="Gambar 3" />
        </div>
        <p className="text-xs text-muted-foreground">
          Gambar utama wajib diisi. Anda bisa menggunakan URL gambar atau upload dari device.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="property_type">Tipe Properti</Label>
          <Select
            value={formData.property_type}
            onValueChange={(value) => setFormData({ ...formData, property_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Apartemen</SelectItem>
              <SelectItem value="house">Rumah</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="kost">Kost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="area_sqm">Luas (m²) *</Label>
          <Input
            id="area_sqm"
            type="number"
            min="1"
            value={formData.area_sqm}
            onChange={(e) =>
              setFormData({
                ...formData,
                area_sqm: Number.parseInt(e.target.value) || 0,
              })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bedrooms">Jumlah Kamar Tidur</Label>
          <Input
            id="bedrooms"
            type="number"
            min="0"
            value={formData.bedrooms}
            onChange={(e) =>
              setFormData({
                ...formData,
                bedrooms: Number.parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="bathrooms">Jumlah Kamar Mandi</Label>
          <Input
            id="bathrooms"
            type="number"
            min="1"
            value={formData.bathrooms}
            onChange={(e) =>
              setFormData({
                ...formData,
                bathrooms: Number.parseInt(e.target.value) || 1,
              })
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor="price_per_month_idr">Harga Sewa per Bulan (IDR) *</Label>
        <Input
          id="price_per_month_idr"
          type="number"
          min="100000"
          step="50000"
          value={formData.price_per_month_idr}
          onChange={(e) =>
            setFormData({
              ...formData,
              price_per_month_idr: Number.parseInt(e.target.value) || 0,
            })
          }
          placeholder="5000000"
          required
        />
        <div className="mt-2 space-y-1">
          {formData.price_per_month_idr > 0 && (
            <p className="text-xs text-muted-foreground">Preview IDR: {formatIDR(formData.price_per_month_idr)}</p>
          )}
          {previewEthPrice > 0 && (
            <p className="text-xs font-medium text-blue-600">
              Harga ETH Fixed: {previewEthPrice.toFixed(6)} ETH per bulan
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Harga ETH akan digenerate secara otomatis dan fixed berdasarkan judul dan harga IDR properti
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="furnished"
          checked={formData.furnished}
          onCheckedChange={(checked) => setFormData({ ...formData, furnished: checked as boolean })}
        />
        <Label htmlFor="furnished">Properti sudah furnished (berperabot)</Label>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Fasilitas</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Tambah fasilitas (contoh: Kolam Renang, Gym, Parkir)"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addFacility(e.currentTarget.value)
                  e.currentTarget.value = ""
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement
                addFacility(input.value)
                input.value = ""
              }}
            >
              Tambah
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.facilities.map((facility, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {facility}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeFacility(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Ketentuan Sewa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="deposit_keamanan">Deposit Keamanan</Label>
            <Input
              id="deposit_keamanan"
              value={formData.rental_terms.deposit_keamanan}
              onChange={(e) => updateRentalTerm("deposit_keamanan", e.target.value)}
              placeholder="1x sewa bulanan"
            />
          </div>
          <div>
            <Label htmlFor="deposit_hewan">Deposit Hewan (jika ada)</Label>
            <Input
              id="deposit_hewan"
              value={formData.rental_terms.deposit_hewan}
              onChange={(e) => updateRentalTerm("deposit_hewan", e.target.value)}
              placeholder="0.5x sewa bulanan"
            />
          </div>
          <div>
            <Label htmlFor="jangka_waktu">Jangka Waktu Sewa</Label>
            <Input
              id="jangka_waktu"
              value={formData.rental_terms.jangka_waktu}
              onChange={(e) => updateRentalTerm("jangka_waktu", e.target.value)}
              placeholder="12-36 bulan"
            />
          </div>
          <div>
            <Label htmlFor="utilitas">Utilitas</Label>
            <Input
              id="utilitas"
              value={formData.rental_terms.utilitas}
              onChange={(e) => updateRentalTerm("utilitas", e.target.value)}
              placeholder="Tanggung jawab penyewa"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="aturan_khusus">Aturan Khusus</Label>
          <Textarea
            id="aturan_khusus"
            value={formData.rental_terms.aturan_khusus}
            onChange={(e) => updateRentalTerm("aturan_khusus", e.target.value)}
            placeholder="Contoh: Tidak merokok di dalam ruangan, tidak boleh pelihara hewan, dll."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Menambahkan..." : "Tambah Properti"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
      </div>
    </form>
  )
}
