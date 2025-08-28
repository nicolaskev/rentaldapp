import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { property_id, blockchain_id } = body

    console.log("[v0] Updating property with blockchain ID:", { property_id, blockchain_id })

    const { data: property, error } = await supabase
      .from("properties")
      .update({ blockchain_id })
      .eq("id", property_id)
      .select()
      .single()

    if (error) {
      console.error("Update error:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to update property: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, data: property })
  } catch (error: any) {
    console.error("POST Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${error.message || "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
