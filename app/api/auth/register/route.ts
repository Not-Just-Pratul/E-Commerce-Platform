import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.json()
  const { name, email, password } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 })
  }

  const existing = await query(
    `
      SELECT id FROM users WHERE email = $1
    `,
    [email],
  )

  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 })
  }

  const result = await query(
    `
      INSERT INTO users (name, email, password_hash, avatar_url)
      VALUES ($1, $2, $3, NULL)
      RETURNING id, name, email, avatar_url
    `,
    [name, email, password],
  )

  return NextResponse.json({ success: true, user: result.rows[0] })
}
