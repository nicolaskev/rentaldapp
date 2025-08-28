import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ✅ GET rental application by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const { data, error } = await supabase
      .from("rental_applications")
      .select(
        `
        *,
        properties (
          title,
          location,
          landlords (
            name,
            email
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[API] GET rental_applications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

// ✅ UPDATE rental application
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // Check application exists
    const { data: existingApp, error: checkError } = await supabase
      .from("rental_applications")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingApp) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    // Update
    const { data: updateResult, error: updateError } = await supabase
      .from("rental_applications")
      .update(body)
      .eq("id", id)
      .select("id")
      .single();

    if (updateError) throw updateError;

    // Fetch full updated record
    const { data: application, error: fetchError } = await supabase
      .from("rental_applications")
      .select(
        `
        *,
        properties (
          title,
          location,
          landlords (
            name,
            email
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({
        success: true,
        data: { id, ...body }, // ✅ tidak duplicate id
        message: "Update successful (fallback)",
      });
    }

    return NextResponse.json({ success: true, data: application });
  } catch (error) {
    console.error("[API] PUT rental_applications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update application" },
      { status: 500 }
    );
  }
}
