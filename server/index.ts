import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import AdminJS, { ActionRequest } from "adminjs";
import AdminJSExpress from "@adminjs/express";
import AdminJSSequelize from "@adminjs/sequelize";
import { Sequelize, DataTypes } from "sequelize";
import { db } from "./db"; // Drizzle ORM usage
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

dotenv.config();

AdminJS.registerAdapter({
	Database: AdminJSSequelize.Database,
	Resource: AdminJSSequelize.Resource,
});
// Initialize Sequelize for AdminJS dashboard
// Initialize Sequelize for AdminJS dashboard
const sequelize = new Sequelize(process.env.DATABASE_URL!, {
	dialect: "postgres",
	logging: false,
	define: {
		underscored: true, // map camelCase fields to snake_case columns
	},
});

// Define AdminJS models
const MessageModel = sequelize.define(
	"Message",
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		content: { type: DataTypes.TEXT, allowNull: false },
		region: { type: DataTypes.STRING, allowNull: false },
		subregion: { type: DataTypes.STRING, allowNull: false },
		latitude: { type: DataTypes.STRING, allowNull: false },
		longitude: { type: DataTypes.STRING, allowNull: false },
		likes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		isApproved: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: "messages",
		timestamps: false,
	}
);
const RegionModel = sequelize.define(
	"Region",
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		name: { type: DataTypes.STRING, allowNull: false },
		subregion: { type: DataTypes.STRING, allowNull: false },
		messageCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
	},
	{
		tableName: "regions",
		timestamps: false,
	}
);

const adminJs = new AdminJS({
	databases: [sequelize],
	resources: [
		{
			resource: MessageModel,
			options: {
				properties: {
					id: {
						isVisible: {
							list: true,
							filter: true,
							show: true,
							edit: false,
							new: false,
						},
					},
				},
				actions: {
					new: {
						http: { method: ["get", "post"] },
						before: async (request: ActionRequest) => {
							+console.log(
								"AdminJS Message new payload:",
								request.payload
							);
							if (request.payload) {
								// Recursively remove any 'id' key in the entire payload
								const removeId = (obj: any) => {
									if (!obj || typeof obj !== "object") return;
									if ("id" in obj) delete obj.id;
									for (const key in obj) removeId(obj[key]);
								};
								removeId(request.payload as any);
							}
							return request;
						},
					},
				},
			},
		},
		{
			resource: RegionModel,
			options: {
				properties: {
					id: {
						isVisible: {
							list: true,
							filter: true,
							show: true,
							edit: false,
							new: false,
						},
					},
				},
				actions: {
					new: {
						http: { method: ["get", "post"] },
						before: async (request: ActionRequest) => {
							+console.log(
								"AdminJS Region new payload:",
								request.payload
							);
							if (request.payload) {
								const removeId = (obj: any) => {
									if (!obj || typeof obj !== "object") return;
									if ("id" in obj) delete obj.id;
									for (const key in obj) removeId(obj[key]);
								};
								removeId(request.payload as any);
							}
							return request;
						},
					},
				},
			},
		},
	],
	rootPath: "/admin",
});

// Mount AdminJS router with authentication
const router = AdminJSExpress.buildAuthenticatedRouter(
	adminJs,
	{
		authenticate: async (email, password) => {
			if (
				email === process.env.ADMIN_USER &&
				password === process.env.ADMIN_PASSWORD
			) {
				return { email };
			}
			return null;
		},
		cookieName: "adminjs",
		cookiePassword:
			process.env.ADMIN_COOKIE_PASSWORD || "change-me-in-production",
	},
	null,
	{
		secret: process.env.ADMIN_COOKIE_PASSWORD || "change-me-in-production",
		resave: false,
		saveUninitialized: true,
	}
);

// Create Express app
const app = express();
// Security middlewares
app.disable('x-powered-by');
app.use(helmet());
// Rate limit API: max 100 requests per 15 minutes per IP
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
// CORS: restrict origins
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || [], credentials: true }));
// Body parser size limit
app.use(adminJs.options.rootPath, router);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// API request logging middleware
app.use((req, res, next) => {
	const start = Date.now();
	const path = req.path;
	let captured: any;
	const origJson = res.json;
	res.json = function (body) {
		captured = body;
		return origJson.call(this, body);
	};
	res.on("finish", () => {
		if (path.startsWith("/api")) {
			const duration = Date.now() - start;
			let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
			if (captured) line += ` :: ${JSON.stringify(captured)}`;
			log(line);
		}
	});
	next();
});

// Mount AdminJS under /admin
// Mount AdminJS under /admin
// Body parsing for API routes

(async () => {
	const server = await registerRoutes(app);

	// Error handler
	app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
		const status = err.status || err.statusCode || 500;
		res.status(status).json({
			message: err.message || "Internal Server Error",
		});
		throw err;
	});

	// Vite or static
	if (app.get("env") === "development") {
		await setupVite(app, server);
	} else {
		serveStatic(app);
	}

	// Start server
	const port =
		typeof process.env.PORT === "string"
			? parseInt(process.env.PORT)
			: 5000;
	server.listen({ port, host: "0.0.0.0" }, () => {
		log(`serving on port ${port}`);
	});
})();
