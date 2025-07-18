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
import cookieParser from "cookie-parser";
import csurf from "csurf";

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
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
		},
	}
);

// Create Express app
const app = express();
// Trust proxy headers (e.g., x-forwarded-proto) for proper HTTPS detection in production
app.set("trust proxy", true);
// Cookie parser (needed for CSRF)
app.use(cookieParser());
// CSRF protection for API routes only: set CSRF token cookie and header
app.use(
	"/api",
	csurf({
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
		},
	})
);
// Expose CSRF token for client-side consumption under /api
app.get("/api/csrf-token", (req, res) => {
	res.json({ csrfToken: (req as any).csrfToken() });
});
// Additional Helmet security headers
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));

// Redirect HTTP to HTTPS and enable HSTS in production
if (process.env.NODE_ENV === "production") {
	app.use((req, res, next) => {
		const proto = req.headers["x-forwarded-proto"] || req.protocol;
		if (proto !== "https") {
			return res.redirect(`https://${req.headers.host}${req.url}`);
		}
		next();
	});
	app.use(
		helmet.hsts({ maxAge: 60 * 60 * 24 * 365, includeSubDomains: true })
	);
}

// Mount AdminJS router with authentication under /admin
app.use(adminJs.options.rootPath, router);
// Body parsing so AdminJS login forms and API JSON are parsed
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
