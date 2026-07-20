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
      SELECT c.id, c.user_id, p.id AS product_id, p.name, p.price, p.image_url, ci.quantity
      FROM carts c
      JOIN cart_items ci ON ci.cart_id = c.id
      JOIN products p ON p.id = ci.product_id
      WHERE c.user_id = $1
      ORDER BY ci.created_at DESC
    `,
    [userId],
  )

  return NextResponse.json(result.rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, productId, quantity = 1 } = body

  if (!userId || !productId) {
    return NextResponse.json({ error: "userId and productId are required" }, { status: 400 })
  }

  await query(
    `
      INSERT INTO carts (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
    `,
    [userId],
  )

  await query(
    `
      INSERT INTO cart_items (cart_id, product_id, quantity)
      SELECT id, $2, $3
      FROM carts
      WHERE user_id = $1
      ON CONFLICT (cart_id, product_id, variant_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    `,
    [userId, productId, quantity],
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
      DELETE FROM cart_items
      USING carts
      WHERE cart_items.cart_id = carts.id
        AND carts.user_id = $1
        AND cart_items.product_id = $2
    `,
    [userId, productId],
  )

  return NextResponse.json({ success: true })
}
