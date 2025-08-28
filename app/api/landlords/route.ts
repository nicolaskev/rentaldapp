import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: landlords, error } = await supabase
      .from("landlords")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: landlords })
  } catch (error) {
    console.error("Error fetching landlords:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch landlords" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, email, wallet_address, phone, address } = body

    // Check if landlord already exists
    const { data: existingLandlord } = await supabase.from("landlords").select("id").eq("id", id).single()

    if (existingLandlord) {
      return NextResponse.json({ success: false, error: "Landlord already exists" }, { status: 409 })
    }

    const { data: landlord, error } = await supabase
      .from("landlords")
      .insert({
        id,
        name,
        email,
        wallet_address,
        phone,
        address,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: landlord })
  } catch (error) {
    console.error("Error creating landlord:", error)
    return NextResponse.json({ success: false, error: "Failed to create landlord" }, { status: 500 })
  }
}
