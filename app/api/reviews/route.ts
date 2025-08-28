import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("property_id")

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 })
    }

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching reviews:", error)
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Error in reviews GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { property_id, reviewer_name, rating, comment } = body

    // Validation
    if (!property_id || !reviewer_name || !rating || !comment) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Generate reviewer initial from name
    const reviewer_initial = reviewer_name
      .split(" ")
      .map((word: string) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2)

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        property_id,
        reviewer_name,
        reviewer_initial,
        rating,
        comment,
        review_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating review:", error)
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error("Error in reviews POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
