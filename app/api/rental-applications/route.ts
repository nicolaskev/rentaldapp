import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_wallet = searchParams.get("tenant_wallet");
    const landlord_id = searchParams.get("landlord_id");

    let query = supabase.from("rental_applications").select(`
        *,
        properties (
          id,
          title,
          price_per_month,
          price_per_month_idr,
          blockchain_id,
          landlords (
            id,
            name,
            email,
            wallet_address
          )
        )
      `);

    if (tenant_wallet) {
      query = query.eq("tenant_wallet", tenant_wallet);
    }

    if (landlord_id) {
      query = query.eq("properties.landlord_id", landlord_id);
    }

    const { data: applications, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data: applications || [] });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      property_id,
      tenant_wallet,
      tenant_name,
      tenant_email,
      tenant_phone,
      tenant_address,
      tenant_occupation,
      tenant_income,
      duration,
      total_amount_idr,
      message,
      skipBlockchain = false,
      enableBlockchain = false,
    } = body;

    console.log("[v0] Creating rental application:", {
      property_id,
      tenant_wallet,
      tenant_name,
      enableBlockchain,
      skipBlockchain,
    });

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select(
        "price_per_month, price_per_month_idr, blockchain_id, landlords(wallet_address)"
      )
      .eq("id", property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    const total_amount_eth = property.price_per_month * duration;
    let blockchain_id = 0;
    let blockchainError = null;

    if (!skipBlockchain && enableBlockchain && property.blockchain_id > 0) {
      try {
        console.log(
          "[v0] Property has blockchain integration, preparing application for smart contract submission"
        );
        console.log("[v0] Property blockchain_id:", property.blockchain_id);
        console.log("[v0] Tenant wallet:", tenant_wallet);

        // For now, generate a temporary blockchain_id
        // In a real implementation, this would be handled by the frontend with wallet connection
        const tempBlockchainId = Math.floor(Math.random() * 1000000);

        console.log(
          "[v0] Generated temporary application blockchain_id:",
          tempBlockchainId
        );
        console.log(
          "[v0] Application will be available for blockchain submission"
        );

        // Note: Actual blockchain submission should be handled by the frontend
        // This API creates the database record with blockchain_id = 0 initially
        // The frontend can then call the blockchain submission and update via /api/rental-applications/blockchain
        blockchain_id = 0; // Reset to 0 for frontend deployment
      } catch (error: any) {
        console.error("[v0] Blockchain preparation failed:", error);
        blockchainError = error.message;
        // Continue with database-only creation
      }
    }

    const { data: application, error } = await supabase
      .from("rental_applications")
      .insert({
        property_id,
        blockchain_id,
        tenant_wallet,
        tenant_name,
        tenant_email,
        tenant_phone,
        tenant_address,
        tenant_occupation,
        tenant_income,
        duration,
        total_amount: total_amount_eth,
        total_amount_idr:
          total_amount_idr || property.price_per_month_idr * duration,
        message,
        is_approved: null,
        is_paid: false,
      })
      .select(
        `
        *,
        properties (
          title,
          location,
          blockchain_id,
          landlords (
            name,
            email,
            wallet_address
          )
        )
      `
      )
      .single();

    if (error) throw error;

    console.log("[v0] Application created successfully:", application.id);

    return NextResponse.json({
      success: true,
      data: application,
      blockchain: {
        enabled: enableBlockchain,
        property_has_blockchain: property.blockchain_id > 0,
        ready_for_submission:
          enableBlockchain &&
          property.blockchain_id > 0 &&
          tenant_wallet &&
          !blockchainError,
        error: blockchainError,
        property_blockchain_id: property.blockchain_id,
      },
    });
  } catch (error: any) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create application: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
