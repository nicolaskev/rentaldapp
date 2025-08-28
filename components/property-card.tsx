"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bed, Bath, Square } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import Link from "next/link"
import type { PropertyApiResponse } from "@/lib/types"

interface PropertyCardProps {
  property: PropertyApiResponse
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { isConnected } = useWallet()

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative">
        <img
          src={
            property.image_1 ||
            `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(property.title) || "/placeholder.svg"}`
          }
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <Badge className={`absolute top-2 right-2 ${property.is_available ? "bg-green-500" : "bg-red-500"}`}>
          {property.is_available ? "Available" : "Rented"}
        </Badge>
        <Badge className="absolute top-2 left-2 bg-blue-500 capitalize">
          {property.property_type.replace("_", " ")}
        </Badge>
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-1">{property.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {property.bedrooms} KT
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {property.bathrooms} KM
          </div>
          <div className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            {property.area_sqm} m²
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{property.description}</p>
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-green-600">{formatIDR(property.price_per_month_idr)}/bulan</div>
          {property.furnished && (
            <Badge variant="outline" className="text-xs">
              Furnished
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {isConnected ? (
          <Link href={`/property/${property.id}`} className="w-full">
            <Button className="w-full" disabled={!property.is_available}>
              {property.is_available ? "Lihat Detail" : "Not Available"}
            </Button>
          </Link>
        ) : (
          <Button className="w-full" disabled>
            Connect Wallet to View
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
