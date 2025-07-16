import { Sequelize } from "sequelize";

// Sequelize 인스턴스 분리
export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
	dialect: "postgres",
	logging: false,
});
