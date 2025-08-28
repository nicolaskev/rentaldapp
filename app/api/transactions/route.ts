import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET transaksi (filter by tenant/landlord wallet)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_wallet = searchParams.get("tenant_wallet");
    const landlord_wallet = searchParams.get("landlord_wallet");

    let query = supabase.from("transactions").select(`
      id,
      application_id,
      tenant_wallet,
      landlord_wallet,
      amount_eth,
      amount_idr,
      transaction_hash,
      payment_type,
      status,
      created_at,
      rental_applications (
        tenant_name,
        properties (
          title
        )
      )
    `);

    if (tenant_wallet) {
      query = query.eq("tenant_wallet", tenant_wallet);
    }

    if (landlord_wallet) {
      query = query.eq("landlord_wallet", landlord_wallet);
    }

    const { data: transactions, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST transaksi baru (simpan pembayaran)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      application_id,
      tenant_wallet,
      landlord_wallet,
      amount_eth,
      amount_idr,
      transaction_hash,
      payment_type = "rent",
    } = body;

    if (
      !application_id ||
      !tenant_wallet ||
      !landlord_wallet ||
      !amount_eth ||
      !transaction_hash
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Cek apakah tx sudah ada
    const { data: existingTransaction } = await supabase
      .from("transactions")
      .select("id")
      .eq("transaction_hash", transaction_hash)
      .single();

    if (existingTransaction) {
      return NextResponse.json(
        { success: false, error: "Transaction already recorded" },
        { status: 409 }
      );
    }

    // Insert transaksi baru
    const { data: transaction, error } = await supabase
      .from("transactions")
      .insert({
        application_id,
        tenant_wallet,
        landlord_wallet,
        amount_eth,
        amount_idr,
        transaction_hash,
        payment_type,
        status: "completed",
      })
      .select(
        `
        id,
        application_id,
        tenant_wallet,
        landlord_wallet,
        amount_eth,
        amount_idr,
        transaction_hash,
        payment_type,
        status,
        created_at,
        rental_applications (
          tenant_name,
          properties (
            title
          )
        )
      `
      )
      .single();

    if (error) throw error;

    // Update aplikasi sewa jadi paid
    const { error: updateError } = await supabase
      .from("rental_applications")
      .update({ is_paid: true })
      .eq("id", application_id);

    if (updateError) {
      console.error("Error updating rental application:", updateError);
    }

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
