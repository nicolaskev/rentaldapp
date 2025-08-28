import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
      return NextResponse.json(
        { success: false, error: "Landlord ID required" },
        { status: 400 }
      );
    }

    // Get properties count
    const { count: propertiesCount } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("landlord_id", landlord_id);

    // Get applications for landlord's properties
    const { data: applications, error: applicationsError } = await supabase
      .from("rental_applications")
      .select(
        `
        *,
        properties!inner (
          id,
          title,
          price_per_month,
          price_per_month_idr,
          landlord_id
        )
      `
      )
      .eq("properties.landlord_id", landlord_id)
      .order("created_at", { ascending: false });

    if (applicationsError) {
      console.error("Applications error:", applicationsError);
      return NextResponse.json(
        { success: false, error: applicationsError.message },
        { status: 500 }
      );
    }

    // Get landlord's wallet address for transactions
    const { data: landlord, error: landlordError } = await supabase
      .from("landlords")
      .select("wallet_address")
      .eq("id", landlord_id)
      .single();

    if (landlordError) {
      console.error("Landlord error:", landlordError);
      return NextResponse.json(
        { success: false, error: landlordError.message },
        { status: 500 }
      );
    }

    // Get transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        `
        *,
        rental_applications (
          tenant_name,
          properties!inner (
            title,
            landlord_id
          )
        )
      `
      )
      .eq("landlord_wallet", landlord.wallet_address)
      .order("created_at", { ascending: false });

    if (transactionsError) {
      console.error("Transactions error:", transactionsError);
    }

    // Calculate stats
    const pendingApplications =
      applications?.filter((app) => !app.is_approved).length || 0;
    const approvedApplications =
      applications?.filter((app) => app.is_approved).length || 0;
    const totalRevenue =
      transactions?.reduce((sum, tx) => sum + (tx.amount_idr || 0), 0) || 0;

    const stats = {
      total_properties: propertiesCount || 0,
      total_applications: applications?.length || 0,
      pending_applications: pendingApplications,
      approved_applications: approvedApplications,
      total_revenue: totalRevenue,
    };

    return NextResponse.json({
      success: true,
      data: {
        stats,
        applications: applications || [],
        transactions: transactions || [],
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
