import type { Database } from "./supabase"

// Database table types
export type Property = Database["public"]["Tables"]["properties"]["Row"]
export type Landlord = Database["public"]["Tables"]["landlords"]["Row"]
export type RentalApplication = Database["public"]["Tables"]["rental_applications"]["Row"]
export type LeaseAgreement = Database["public"]["Tables"]["lease_agreements"]["Row"]
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"]
export type Review = Database["public"]["Tables"]["reviews"]["Row"]

// Insert types for creating new records
export type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"]
export type LandlordInsert = Database["public"]["Tables"]["landlords"]["Insert"]
export type RentalApplicationInsert = Database["public"]["Tables"]["rental_applications"]["Insert"]
export type LeaseAgreementInsert = Database["public"]["Tables"]["lease_agreements"]["Insert"]
export type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"]
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"]

// Update types for updating existing records
export type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"]
export type LandlordUpdate = Database["public"]["Tables"]["landlords"]["Update"]
export type RentalApplicationUpdate = Database["public"]["Tables"]["rental_applications"]["Update"]
export type LeaseAgreementUpdate = Database["public"]["Tables"]["lease_agreements"]["Update"]
export type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"]
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"]

// Extended types with relationships
export type PropertyWithLandlord = Property & {
  landlords: {
    name: string
    email: string
    wallet_address: string
  }
}

export type PropertyWithExtras = Property & {
  landlords?: {
    name: string
    wallet_address: string
  }
  facilities: string[] | null   
  rental_terms: {
    deposit_keamanan?: string
    deposit_hewan?: string
    jangka_waktu?: string
    utilitas?: string
    aturan_khusus?: string
  }
}

export type RentalApplicationWithProperty = RentalApplication & {
  properties: Property
}

export type LeaseAgreementWithDetails = LeaseAgreement & {
  rental_applications: RentalApplicationWithProperty
  landlords: Landlord
}

// API Response types
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}>

// Wallet and blockchain types
export type WalletContextType = {
  address: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  loading: boolean
}

// Status enums
export enum ApplicationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum LeaseStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  ACTIVE = "active",
  EXPIRED = "expired",
  TERMINATED = "terminated",
}

export enum TransactionStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  FAILED = "failed",
}

export enum PaymentType {
  RENT = "rent",
  DEPOSIT = "deposit",
  SECURITY_DEPOSIT = "security_deposit",
}

// Extended API Response types
export type PropertyApiResponse = Omit<Property, "landlord_id"> & {
  landlords: {
    id: string // Added missing id field to fix type mismatch
    name: string
    email: string
    wallet_address: string
  }
}

export type ReviewFormData = {
  reviewer_name: string
  rating: number
  comment: string
}

export type PropertyFormData = {
  title: string
  description: string
  price_per_month_idr: number
  property_type: string
  bedrooms: number
  bathrooms: number
  area_sqm: number
  furnished: boolean
  facilities: string[]
  rental_terms: {
    deposit_keamanan: string
    deposit_hewan: string
    jangka_waktu: string
    utilitas: string
    aturan_khusus: string
  }
}
