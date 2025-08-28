import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET property by ID (Next.js 15 style)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ⬅ wajib pakai await

  try {
    console.log("[API] GET property by id:", id);

    const { data, error } = await supabase
      .from("properties")
      .select(
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
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[API] GET property by id error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch property" },
      { status: 500 }
    );
  }
}
