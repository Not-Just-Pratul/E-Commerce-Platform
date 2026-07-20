"use server"

import { cookies } from "next/headers"
import { query } from "@/lib/db"

export async function login(email: string, password: string) {
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
    return { success: false, error: "Invalid email or password" }
  }

  const cookieStore = await cookies()
  cookieStore.set("userId", user.id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
  })

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar_url,
    },
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("userId")
  return { success: true }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value

  if (!userId) {
    return null
  }

  const result = await query(
    `
      SELECT id, name, email, avatar_url
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
  )

  const user = result.rows[0]

  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar_url,
  }
}

