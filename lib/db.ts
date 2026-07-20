import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined. Add your Neon Postgres connection string to .env.local")
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
})

export async function query(text: string, params: unknown[] = []) {
  return pool.query(text, params)
}

export async function testDatabaseConnection() {
  const result = await query("SELECT NOW() AS now")
  return result.rows[0]?.now
}
