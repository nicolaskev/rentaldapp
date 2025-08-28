import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const landlord_id = searchParams.get("landlord_id")
    const tenant_wallet = searchParams.get("tenant_wallet")
    const application_id = searchParams.get("application_id")

    let query = supabase.from("lease_agreements").select(`
        *,
        rental_applications (
          *,
          properties (
            *,
            landlords (
              name,
              email,
              wallet_address
            )
          )
        )
      `)

    if (landlord_id) {
      query = query.eq("landlord_id", landlord_id)
    }

    if (tenant_wallet) {
      query = query.eq("tenant_wallet", tenant_wallet)
    }

    if (application_id) {
      query = query.eq("application_id", application_id)
    }

    const { data: agreements, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: agreements })
  } catch (error) {
    console.error("Error fetching lease agreements:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch lease agreements" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      application_id,
      landlord_id,
      tenant_wallet,
      lease_start_date,
      lease_end_date,
      monthly_rent,
      monthly_rent_idr,
      security_deposit,
      security_deposit_idr,
      terms_and_conditions,
      status = "pending",
    } = body

    const { data: agreement, error } = await supabase
      .from("lease_agreements")
      .insert({
        application_id,
        landlord_id,
        tenant_wallet,
        lease_start_date,
        lease_end_date,
        monthly_rent,
        monthly_rent_idr,
        security_deposit,
        security_deposit_idr,
        terms_and_conditions,
        status,
      })
      .select(`
        *,
        rental_applications (
          *,
          properties (
            title,
            location
          )
        )
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: agreement })
  } catch (error) {
    console.error("Error creating lease agreement:", error)
    return NextResponse.json({ success: false, error: "Failed to create lease agreement" }, { status: 500 })
  }
}
