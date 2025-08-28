import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all properties OR filter by landlord_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const landlordId = searchParams.get("landlord_id");

    let query = supabase.from("properties").select(
      `
        *,
        landlords (
          id,
          name,
          email
        ),
        rental_applications (
          id,
          tenant_name,
          is_approved,
          is_paid
        )
      `
    );

    if (landlordId) {
      query = query.eq("landlord_id", landlordId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[API] GET properties error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
