import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL environment variable is required");
}

// Render/managed Postgres 환경은 TLS를 요구하는 경우가 많다.
const pool = new Pool({
	connectionString,
	ssl:
		process.env.NODE_ENV === "production"
			? { rejectUnauthorized: false }
			: undefined,
});

pool.on("error", (err) => {
	console.error("Unexpected PostgreSQL pool error:", err);
});

// Drizzle ORM 인스턴스 생성
export const db = drizzle(pool);
