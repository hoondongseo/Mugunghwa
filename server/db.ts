import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// PostgreSQL 연결 설정
const pool = new Pool({
	connectionString:
		process.env.DATABASE_URL ||
		"postgresql://user:password@localhost:5432/mugunghwa",
});

// Drizzle ORM 인스턴스 생성
export const db = drizzle(pool);
