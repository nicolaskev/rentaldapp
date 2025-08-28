import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const body = await request.json()
    const { status, landlord_signature, approval_notes } = body

    const updateData: any = { status }

    if (landlord_signature) {
      updateData.landlord_signature = landlord_signature
    }

    if (approval_notes) {
      updateData.approval_notes = approval_notes
    }

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString()
    }

    const { data: agreement, error } = await supabase
      .from("lease_agreements")
      .update(updateData)
      .eq("id", id)
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
    console.error("Error updating lease agreement:", error)
    return NextResponse.json({ success: false, error: "Failed to update lease agreement" }, { status: 500 })
  }
}
