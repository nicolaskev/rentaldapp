import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jyglqiukslalwryjnlwe.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5Z2xxaXVrc2xhbHdyeWpubHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzIxMzcsImV4cCI6MjA2ODUwODEzN30.ZtDR2po6h3QjOgMwGzcIvTvPdqBeFq36Ucj0fp8DXz8";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  console.error("SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("SUPABASE_ANON_KEY:", supabaseKey ? "✓" : "✗");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function createSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("count", { count: "exact", head: true });
    if (error) {
      console.error("Supabase connection test failed:", error);
      return false;
    }
    console.log("Supabase connection successful");
    return true;
  } catch (error) {
    console.error("Supabase connection error:", error);
    return false;
  }
}

export type Database = {
  public: {
    Tables: {
      landlords: {
        Row: {
          id: string;
          email: string;
          name: string;
          wallet_address: string;
          phone: string | null;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          wallet_address: string;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          wallet_address?: string;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          landlord_id: string;
          blockchain_id: number;
          title: string;
          description: string;
          price_per_month: number;
          price_per_month_idr: number;
          price_per_month_eth: number | null;
          image_1: string | null;
          image_2: string | null;
          image_3: string | null;
          property_type: string;
          bedrooms: number;
          bathrooms: number;
          area_sqm: number;
          furnished: boolean;
          is_available: boolean;
          facilities: string[] | null;
          rental_terms: {
            deposit_keamanan?: string;
            deposit_hewan?: string;
            jangka_waktu?: string;
            utilitas?: string;
            aturan_khusus?: string;
          } | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          blockchain_id: number;
          title: string;
          description: string;
          price_per_month: number;
          price_per_month_idr: number;
          price_per_month_eth?: number | null;
          image_1?: string | null;
          image_2?: string | null;
          image_3?: string | null;
          property_type?: string;
          bedrooms?: number;
          bathrooms?: number;
          area_sqm?: number;
          furnished?: boolean;
          is_available?: boolean;
          facilities?: string[] | null;
          rental_terms?: {
            deposit_keamanan?: string;
            deposit_hewan?: string;
            jangka_waktu?: string;
            utilitas?: string;
            aturan_khusus?: string;
          } | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          landlord_id?: string;
          blockchain_id?: number;
          title?: string;
          description?: string;
          price_per_month?: number;
          price_per_month_idr?: number;
          price_per_month_eth?: number | null;
          image_1?: string | null;
          image_2?: string | null;
          image_3?: string | null;
          property_type?: string;
          bedrooms?: number;
          bathrooms?: number;
          area_sqm?: number;
          furnished?: boolean;
          is_available?: boolean;
          facilities?: string[] | null;
          rental_terms?: {
            deposit_keamanan?: string;
            deposit_hewan?: string;
            jangka_waktu?: string;
            utilitas?: string;
            aturan_khusus?: string;
          } | null;
          created_at?: string;
        };
      };
      rental_applications: {
        Row: {
          id: string;
          property_id: string;
          blockchain_id: number;
          tenant_wallet: string;
          tenant_name: string;
          tenant_email: string;
          tenant_phone: string;
          tenant_address: string;
          tenant_occupation: string;
          tenant_income: number;
          duration: number;
          total_amount: number;
          total_amount_idr: number;
          message: string | null;
          is_approved: boolean;
          is_paid: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          blockchain_id: number;
          tenant_wallet: string;
          tenant_name: string;
          tenant_email: string;
          tenant_phone: string;
          tenant_address: string;
          tenant_occupation: string;
          tenant_income: number;
          duration: number;
          total_amount: number;
          total_amount_idr: number;
          message?: string | null;
          is_approved?: boolean;
          is_paid?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          blockchain_id?: number;
          tenant_wallet?: string;
          tenant_name?: string;
          tenant_email?: string;
          tenant_phone?: string;
          tenant_address?: string;
          tenant_occupation?: string;
          tenant_income?: number;
          duration?: number;
          total_amount?: number;
          total_amount_idr?: number;
          message?: string | null;
          is_approved?: boolean;
          is_paid?: boolean;
          created_at?: string;
        };
      };
      lease_agreements: {
        Row: {
          id: string;
          application_id: string;
          landlord_id: string;
          tenant_wallet: string;
          lease_start_date: string;
          lease_end_date: string;
          monthly_rent: number;
          monthly_rent_idr: number;
          security_deposit: number;
          security_deposit_idr: number;
          terms_and_conditions: string | null;
          status: string;
          landlord_signature: string | null;
          tenant_signature: string | null;
          approval_notes: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          landlord_id: string;
          tenant_wallet: string;
          lease_start_date: string;
          lease_end_date: string;
          monthly_rent: number;
          monthly_rent_idr: number;
          security_deposit: number;
          security_deposit_idr: number;
          terms_and_conditions?: string | null;
          status?: string;
          landlord_signature?: string | null;
          tenant_signature?: string | null;
          approval_notes?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          landlord_id?: string;
          tenant_wallet?: string;
          lease_start_date?: string;
          lease_end_date?: string;
          monthly_rent?: number;
          monthly_rent_idr?: number;
          security_deposit?: number;
          security_deposit_idr?: number;
          terms_and_conditions?: string | null;
          status?: string;
          landlord_signature?: string | null;
          tenant_signature?: string | null;
          approval_notes?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          application_id: string;
          tenant_wallet: string;
          landlord_wallet: string;
          amount_eth: number;
          amount_idr: number;
          transaction_hash: string;
          payment_type: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          tenant_wallet: string;
          landlord_wallet: string;
          amount_eth: number;
          amount_idr: number;
          transaction_hash: string;
          payment_type?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          tenant_wallet?: string;
          landlord_wallet?: string;
          amount_eth?: number;
          amount_idr?: number;
          transaction_hash?: string;
          payment_type?: string;
          status?: string;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          property_id: string;
          reviewer_name: string;
          reviewer_initial: string;
          rating: number;
          comment: string;
          review_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          reviewer_name: string;
          reviewer_initial: string;
          rating: number;
          comment: string;
          review_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          reviewer_name?: string;
          reviewer_initial?: string;
          rating?: number;
          comment?: string;
          review_date?: string;
          created_at?: string;
        };
      };
    };
  };
};
