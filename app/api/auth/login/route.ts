import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { query } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 })
  }

  const result = await query(
    `
      SELECT id, name, email, avatar_url, password_hash
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  )

  const user = result.rows[0]

  if (!user || user.password_hash !== password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set("userId", user.id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
  })

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar_url,
    },
  })
}
