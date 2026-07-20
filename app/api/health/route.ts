import { NextResponse } from "next/server"
import { testDatabaseConnection } from "@/lib/db"

export async function GET() {
  try {
    const now = await testDatabaseConnection()

    return NextResponse.json({
      ok: true,
      database: "postgres",
      timestamp: now,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    )
  }
}
