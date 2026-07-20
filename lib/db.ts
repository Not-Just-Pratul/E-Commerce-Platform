import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : null

export async function query(text: string, params: unknown[] = []) {
  if (!pool) {
    throw new Error("DATABASE_URL is not defined. Add your Neon Postgres connection string to .env.local")
  }

  return pool.query(text, params)
}

export async function testDatabaseConnection() {
  const result = await query("SELECT NOW() AS now")
  return result.rows[0]?.now
}
