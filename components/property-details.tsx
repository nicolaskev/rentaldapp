"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Bed, Bath, Home, Square, Check, Star } from "lucide-react"
import { formatIDR } from "@/lib/currency"
import type { PropertyApiResponse, Review, ReviewFormData } from "@/lib/types"

interface PropertyDetailsProps {
  property: PropertyApiResponse
  additionalImages?: string[]
}

const REVIEWER_POOL = [
  { name: "Andi Pratama", initial: "A", profession: "Software Engineer" },
  { name: "Bella Sari", initial: "B", profession: "Marketing Manager" },
  { name: "Citra Dewi", initial: "C", profession: "Dokter" },
  { name: "Doni Kurniawan", initial: "D", profession: "Entrepreneur" },
  { name: "Eka Putri", initial: "E", profession: "Teacher" },
  { name: "Fajar Nugroho", initial: "F", profession: "Architect" },
  { name: "Gita Maharani", initial: "G", profession: "Designer" },
  { name: "Hendra Wijaya", initial: "H", profession: "Consultant" },
  { name: "Indira Sari", initial: "I", profession: "Lawyer" },
  { name: "Joko Santoso", initial: "J", profession: "Engineer" },
  { name: "Kartika Dewi", initial: "K", profession: "Pharmacist" },
  { name: "Lukman Hakim", initial: "L", profession: "Manager" },
  { name: "Maya Sari", initial: "M", profession: "Nurse" },
  { name: "Nanda Pratama", initial: "N", profession: "Analyst" },
  { name: "Oki Rahayu", initial: "O", profession: "Accountant" },
  { name: "Putri Indah", initial: "P", profession: "HR Manager" },
  { name: "Qori Ananda", initial: "Q", profession: "Journalist" },
  { name: "Rizki Maulana", initial: "R", profession: "Developer" },
  { name: "Sinta Dewi", initial: "S", profession: "Psychologist" },
  { name: "Toni Setiawan", initial: "T", profession: "Sales Manager" },
]

const REVIEW_TEMPLATES = [
  "Properti yang sangat bagus dan bersih. Lokasi strategis dekat dengan pusat kota dan transportasi umum. Pemilik sangat responsif dan membantu.",
  "Rumah yang nyaman dengan lingkungan yang tenang. Fasilitas lengkap sesuai dengan deskripsi. Harga saja agak jauh dari pusat perbelanjaan.",
  "Tempat yang sempurna untuk keluarga kecil. Dilengkapi dengan kitchen set dan kamar mandi dalam. Pemilik sangat responsif dan membantu.",
  "Properti cukup baik untuk harga yang ditawarkan. Beberapa fasilitas perlu maintenance lebih baik, tapi overall memuaskan.",
  "Lokasi yang sangat strategis dan mudah diakses. Properti bersih dan terawat dengan baik. Sangat puas dengan pelayanannya.",
  "Apartemen yang modern dan nyaman. Fasilitas gedung lengkap dan keamanan 24 jam. Cocok untuk profesional muda.",
  "Rumah yang luas dan cocok untuk keluarga besar. Halaman yang cukup untuk anak-anak bermain. Lingkungan yang aman dan nyaman.",
  "Properti yang value for money. Meskipun tidak terlalu besar, tapi fungsional dan strategis lokasinya.",
  "Tempat yang tenang dan damai, cocok untuk yang suka suasana residential. Akses ke jalan raya mudah dan dekat dengan fasilitas umum.",
  "Kualitas bangunan bagus dan finishing yang rapi. Pemilik juga sangat kooperatif dalam hal maintenance dan perbaikan.",
]

function generatePropertyHash(propertyId: string): number {
  let hash = 0
  for (let i = 0; i < propertyId.length; i++) {
    const char = propertyId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

function generateReviewsForProperty(propertyId: string): Review[] {
  const hash = generatePropertyHash(propertyId)
  const numReviews = 2 + (hash % 3) // 2-4 reviews per property
  const reviews: Review[] = []

  // Use hash to select different reviewers for each property
  const selectedReviewers = new Set<number>()

  for (let i = 0; i < numReviews; i++) {
    let reviewerIndex = (hash + i * 7) % REVIEWER_POOL.length

    // Ensure no duplicate reviewers for the same property
    while (selectedReviewers.has(reviewerIndex)) {
      reviewerIndex = (reviewerIndex + 1) % REVIEWER_POOL.length
    }
    selectedReviewers.add(reviewerIndex)

    const reviewer = REVIEWER_POOL[reviewerIndex]
    const rating = 3 + ((hash + i * 3) % 3) // Rating between 3-5
    const commentIndex = (hash + i * 11) % REVIEW_TEMPLATES.length
    const daysAgo = 7 + ((hash + i * 5) % 90) // 7-97 days ago

    const reviewDate = new Date()
    reviewDate.setDate(reviewDate.getDate() - daysAgo)

    reviews.push({
      id: `${propertyId}-review-${i}`,
      property_id: propertyId,
      reviewer_name: reviewer.name,
      reviewer_initial: reviewer.initial,
      rating: rating,
      comment: REVIEW_TEMPLATES[commentIndex],
      review_date: reviewDate.toISOString(),
      created_at: new Date().toISOString()
    })
  }

  return reviews.sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime())
}

export function PropertyDetails({ property, additionalImages = [] }: PropertyDetailsProps) {
  const [activeTab, setActiveTab] = useState("detail")
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    reviewer_name: "",
    rating: 0,
    comment: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    fetchReviews()
  }, [property.id])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching reviews for property:", property.id)
      const response = await fetch(`/api/reviews?property_id=${property.id}`)
      const data = await response.json()

      console.log("[v0] Reviews API response:", data)

      if (response.ok) {
        setReviews(data.reviews || [])
      } else {
        console.error("Failed to fetch reviews:", data.error)
        setReviews([])
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (!reviewForm.reviewer_name || !reviewForm.rating || !reviewForm.comment) {
      alert("Mohon lengkapi semua field")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_id: property.id,
          reviewer_name: reviewForm.reviewer_name,
          reviewer_initial: reviewForm.reviewer_name.charAt(0).toUpperCase(),
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Add new review to the list
        setReviews([data.review, ...reviews])
        // Reset form
        setReviewForm({
          reviewer_name: "",
          rating: 0,
          comment: "",
        })
        alert("Ulasan berhasil dikirim!")
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Terjadi kesalahan saat mengirim ulasan")
    } finally {
      setSubmitting(false)
    }
  }

  const averageRating =
    reviews.length > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : "0.0"

  const propertyImages = [property.image_1, property.image_2, property.image_3].filter(Boolean) as string[]
  const allImages = [...propertyImages, ...additionalImages]

  if (allImages.length === 0) {
    allImages.push(`/placeholder.svg?height=400&width=600&query=${encodeURIComponent(property.title)}`)
  }

  const facilities = (property as any).facilities || [
    "Kolam Renang",
    "Taman",
    "Area Teras Luas",
    "Garasi",
    "Keamanan 24 Jam",
    "Dekat Sekolah dan Pasar",
  ]

  const rentalTerms = (property as any).rental_terms
    ? [
        {
          label: "Deposit Keamanan",
          value: (property as any).rental_terms.deposit_keamanan || `${formatIDR(property.price_per_month_idr)}`,
        },
        {
          label: "Deposit Hewan",
          value: (property as any).rental_terms.deposit_hewan || `${formatIDR(property.price_per_month_idr / 2)}`,
        },
        {
          label: "Jangka Waktu Sewa",
          value: (property as any).rental_terms.jangka_waktu || "12-36 bulan",
        },
        {
          label: "Utilitas",
          value: (property as any).rental_terms.utilitas || "Tanggung Jawab Penyewa",
        },
      ]
    : [
        {
          label: "Deposit Keamanan",
          value: `${formatIDR(property.price_per_month_idr)}`,
        },
        {
          label: "Deposit Hewan",
          value: `${formatIDR(property.price_per_month_idr / 2)}`,
        },
        { label: "Jangka Waktu Sewa", value: "12-36 bulan" },
        { label: "Utilitas", value: "Tanggung Jawab Penyewa" },
      ]

  return (
    <div className="space-y-6">
      {/* Property Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{property.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={property.is_available ? "bg-green-500" : "bg-red-500"}>
            {property.is_available ? "Tersedia" : "Tidak Tersedia"}
          </Badge>
          <div className="text-xl font-semibold text-green-600">{formatIDR(property.price_per_month_idr)}/bulan</div>
        </div>
      </div>

      {/* Property Images */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 aspect-video relative rounded-lg overflow-hidden">
          <img src={allImages[0] || "/placeholder.svg"} alt={property.title} className="w-full h-full object-cover" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {allImages.slice(1, 3).map((image, index) => (
            <div key={index} className="aspect-video relative rounded-lg overflow-hidden">
              <img
                src={image || "/placeholder.svg"}
                alt={`${property.title} - ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Property Info Tabs */}
      <Tabs defaultValue="detail" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="detail">Detail Properti</TabsTrigger>
          <TabsTrigger value="ulasan">Ulasan ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="detail" className="space-y-6">
          {/* Property Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                <Home className="h-6 w-6" />
              </div>
              <span className="text-sm text-muted-foreground">Tipe</span>
              <span className="font-medium capitalize">{property.property_type.replace("_", " ")}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                <Bed className="h-6 w-6" />
              </div>
              <span className="text-sm text-muted-foreground">Kamar Tidur</span>
              <span className="font-medium">{property.bedrooms}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                <Bath className="h-6 w-6" />
              </div>
              <span className="text-sm text-muted-foreground">Kamar Mandi</span>
              <span className="font-medium">{property.bathrooms}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                <Square className="h-6 w-6" />
              </div>
              <span className="text-sm text-muted-foreground">Luas</span>
              <span className="font-medium">{property.area_sqm} m²</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Deskripsi</h3>
            <p className="text-muted-foreground">
              {property.description ||
                `${
                  property.property_type === "apartment" ? "Apartemen" : "Rumah"
                } yang nyaman dan modern dengan fasilitas lengkap. Lokasi strategis dengan akses mudah ke berbagai fasilitas umum. Cocok untuk keluarga yang mencari tempat tinggal berkualitas.`}
            </p>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Fasilitas</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {facilities.map((facility: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rental Terms */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Ketentuan Sewa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rentalTerms.map((term, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">{term.label}:</span>
                  <span className="font-medium">{term.value}</span>
                </div>
              ))}
            </div>
            {(property as any).rental_terms?.aturan_khusus && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Aturan Khusus:</h4>
                <p className="text-sm text-muted-foreground">{(property as any).rental_terms.aturan_khusus}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ulasan" className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ulasan Terbaru</h3>
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4"
                      fill={star <= Math.round(Number.parseFloat(averageRating)) ? "#FFD700" : "none"}
                      stroke="#FFD700"
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm font-medium">
                  {averageRating}/5 ({reviews.length} ulasan)
                </span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Memuat ulasan...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Belum ada ulasan untuk properti ini</div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            {review.reviewer_initial}
                          </div>
                          <span className="font-medium">{review.reviewer_name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.review_date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="h-6 w-6"
                            fill={star <= review.rating ? "#FFD700" : "none"}
                            stroke="#FFD700"
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tulis Ulasan</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label htmlFor="reviewer_name" className="block text-sm font-medium mb-1">
                      Nama
                    </label>
                    <Input
                      id="reviewer_name"
                      type="text"
                      value={reviewForm.reviewer_name}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })}
                      placeholder="Masukkan nama Anda"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Peringkat</label>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="p-1"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        >
                          <Star
                            className="h-6 w-6"
                            fill={star <= (hoverRating || reviewForm.rating) ? "#FFD700" : "none"}
                            stroke="#FFD700"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium mb-1">
                      Komentar
                    </label>
                    <Textarea
                      id="comment"
                      rows={4}
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Bagikan pengalaman Anda dengan properti ini..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Mengirim..." : "Kirim Ulasan"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
