import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const isLocalhost =
  process.env.DB_HOST === "localhost" || process.env.DB_HOST === "127.0.0.1";

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
  ssl: isLocalhost
    ? false
    : {
        rejectUnauthorized: false,
      },
});

export async function connectDB() {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL connected successfully");
    client.release();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}