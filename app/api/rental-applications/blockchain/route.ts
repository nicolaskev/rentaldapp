import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { application_id, blockchain_id } = body

    console.log("[v0] Updating application with blockchain ID:", { application_id, blockchain_id })

    const { data: application, error } = await supabase
      .from("rental_applications")
      .update({ blockchain_id })
      .eq("id", application_id)
      .select()
      .single()

    if (error) {
      console.error("Update error:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to update application: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, data: application })
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
