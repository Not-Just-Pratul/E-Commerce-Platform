import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const result = await query(
    `
      SELECT w.id, w.user_id, p.id AS product_id, p.name, p.price, p.image_url
      FROM wishlist_items w
      JOIN products p ON p.id = w.product_id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `,
    [userId],
  )

  return NextResponse.json(result.rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, productId } = body

  if (!userId || !productId) {
    return NextResponse.json({ error: "userId and productId are required" }, { status: 400 })
  }

  await query(
    `
      INSERT INTO wishlist_items (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
    `,
    [userId, productId],
  )

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const body = await req.json()
  const { userId, productId } = body

  if (!userId || !productId) {
    return NextResponse.json({ error: "userId and productId are required" }, { status: 400 })
  }

  await query(
    `
      DELETE FROM wishlist_items
      WHERE user_id = $1 AND product_id = $2
    `,
    [userId, productId],
  )

  return NextResponse.json({ success: true })
}
