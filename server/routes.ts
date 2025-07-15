import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
	// Get all approved messages
	app.get("/api/messages", async (req, res) => {
		try {
			const limit = parseInt(req.query.limit as string) || 50;
			const offset = parseInt(req.query.offset as string) || 0;
			const messages = await storage.getMessages(limit, offset); // fetch all messages, not only approved
			res.json(messages);
		} catch (error) {
			console.error("Error in GET /api/messages:", error);
			res.status(500).json({
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch messages",
			});
		}
	});

	// Get messages by region
	app.get("/api/messages/region/:region", async (req, res) => {
		try {
			const region = decodeURIComponent(req.params.region);
			const limit = parseInt(req.query.limit as string) || 50;
			const messages = await storage.getMessagesByRegion(region, limit);
			res.json(messages);
		} catch (error) {
			res.status(500).json({
				error: "Failed to fetch messages by region",
			});
		}
	});

	// Search messages
	app.get("/api/messages/search", async (req, res) => {
		try {
			const query = req.query.q as string;
			if (!query) {
				return res
					.status(400)
					.json({ error: "Search query is required" });
			}
			const limit = parseInt(req.query.limit as string) || 50;
			const messages = await storage.searchMessages(query, limit);
			res.json(messages);
		} catch (error) {
			res.status(500).json({ error: "Failed to search messages" });
		}
	});

	// Create a new message
	app.post("/api/messages", async (req, res) => {
		try {
			const validatedData = insertMessageSchema.parse(req.body);
			const message = await storage.createMessage(validatedData);
			res.status(201).json(message);
		} catch (error) {
			console.error("Error in POST /api/messages:", error);
			if (error instanceof z.ZodError) {
				res.status(400).json({
					error: "Validation failed",
					details: error.errors,
				});
			} else {
				res.status(500).json({
					error:
						error instanceof Error
							? error.message
							: "Failed to create message",
				});
			}
		}
	});

	// Like a message
	app.post("/api/messages/:id/like", async (req, res) => {
		try {
			const id = parseInt(req.params.id);
			if (isNaN(id)) {
				return res.status(400).json({ error: "Invalid message ID" });
			}
			const message = await storage.likeMessage(id);
			if (!message) {
				return res.status(404).json({ error: "Message not found" });
			}
			res.json(message);
		} catch (error) {
			console.error(
				`Error in POST /api/messages/:id/like - id=${req.params.id}:`,
				error
			);
			res.status(500).json({
				error:
					error instanceof Error
						? error.message
						: "Failed to like message",
			});
		}
	});
	// Unlike a message
	app.post("/api/messages/:id/unlike", async (req, res) => {
		try {
			const id = parseInt(req.params.id);
			if (isNaN(id)) {
				return res.status(400).json({ error: "Invalid message ID" });
			}
			const message = await storage.unlikeMessage(id);
			if (!message) {
				return res.status(404).json({ error: "Message not found" });
			}
			res.json(message);
		} catch (error) {
			console.error(
				`Error in POST /api/messages/:id/unlike - id=${req.params.id}:`,
				error
			);
			res.status(500).json({
				error:
					error instanceof Error
						? error.message
						: "Failed to unlike message",
			});
		}
	});

	// Update a message's content
	app.put("/api/messages/:id", async (req, res) => {
		try {
			const id = parseInt(req.params.id);
			const { content } = req.body;
			if (isNaN(id) || typeof content !== "string") {
				return res.status(400).json({ error: "Invalid request data" });
			}
			const updated = await storage.updateMessage(id, content);
			if (!updated) {
				return res.status(404).json({ error: "Message not found" });
			}
			res.json(updated);
		} catch (error) {
			console.error(
				`Error in PUT /api/messages/:id - id=${req.params.id}:`,
				error
			);
			res.status(500).json({
				error:
					error instanceof Error
						? error.message
						: "Failed to update message",
			});
		}
	});

	// Delete a message
	app.delete("/api/messages/:id", async (req, res) => {
		try {
			const id = parseInt(req.params.id);
			if (isNaN(id)) {
				return res.status(400).json({ error: "Invalid message ID" });
			}
			await storage.deleteMessage(id);
			res.status(204).end();
		} catch (error) {
			console.error(
				`Error in DELETE /api/messages/:id - id=${req.params.id}:`,
				error
			);
			res.status(500).json({
				error:
					error instanceof Error
						? error.message
						: "Failed to delete message",
			});
		}
	});

	// Get all regions
	app.get("/api/regions", async (req, res) => {
		try {
			const regions = await storage.getRegions();
			res.json(regions);
		} catch (error) {
			res.status(500).json({ error: "Failed to fetch regions" });
		}
	});

	// Get statistics
	app.get("/api/statistics", async (req, res) => {
		try {
			const [totalMessages, totalRegions, todayMessages, regionStats] =
				await Promise.all([
					storage.getTotalMessagesCount(),
					storage.getTotalRegionsCount(),
					storage.getTodayMessagesCount(),
					storage.getRegionStats(),
				]);

			res.json({
				totalMessages,
				totalRegions,
				todayMessages,
				regionStats,
			});
		} catch (error) {
			console.error("Error in GET /api/statistics:", error);
			res.status(500).json({
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch statistics",
			});
		}
	});

	// Proxy GeoJSON for South Korea provinces
	app.get("/api/geojson", async (req, res) => {
		const geoUrl =
			"https://raw.githubusercontent.com/southkorea/southkorea-maps/master/gadm/json/skorea-provinces-geo.json";
		try {
			const response = await fetch(geoUrl);
			if (!response.ok) {
				return res.status(response.status).send(response.statusText);
			}
			const data = await response.json();
			res.json(data);
		} catch (err) {
			console.error("GeoJSON proxy error", err);
			res.status(500).json({ error: "Failed to fetch GeoJSON" });
		}
	});

	const httpServer = createServer(app);
	return httpServer;
}
