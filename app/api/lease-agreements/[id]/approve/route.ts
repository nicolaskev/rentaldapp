import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ⬅️ harus pakai await
  const body = await request.json();
  const { landlord_signature, approval_notes } = body;

  try {
    const { data: agreement, error: agreementError } = await supabase
      .from("lease_agreements")
      .update({
        status: "approved",
        landlord_signature,
        approval_notes,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id) // ⬅️ id dari await params
      .select(
        `
        *,
        rental_applications (
          id,
          property_id
        )
      `
      )
      .single();

    if (agreementError) throw agreementError;

    const { error: applicationError } = await supabase
      .from("rental_applications")
      .update({ is_approved: true })
      .eq("id", agreement.application_id);

    if (applicationError) throw applicationError;

    return NextResponse.json({ success: true, data: agreement });
  } catch (error) {
    console.error("Error approving lease agreement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to approve lease agreement" },
      { status: 500 }
    );
  }
}
