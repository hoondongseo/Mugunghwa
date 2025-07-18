// Drizzle-based PostgreSQL storage implementation
import { db } from "./db";
import {
	messages,
	regions,
	users,
	type Message,
	type Region,
	type User,
	type InsertMessage,
	type InsertRegion,
	type InsertUser,
} from "../shared/schema";
import { eq, and, ilike, gte, sql } from "drizzle-orm";

export interface IStorage {
	getUser(id: number): Promise<User | undefined>;
	getUserByUsername(username: string): Promise<User | undefined>;
	createUser(user: InsertUser): Promise<User>;
	getMessages(limit?: number, offset?: number): Promise<Message[]>;
	getMessagesByRegion(region: string, limit?: number): Promise<Message[]>;
	getApprovedMessages(limit?: number, offset?: number): Promise<Message[]>;
	createMessage(message: InsertMessage): Promise<Message>;
	approveMessage(id: number): Promise<Message | undefined>;
	likeMessage(id: number): Promise<Message | undefined>;
	unlikeMessage(id: number): Promise<Message | undefined>;
	searchMessages(query: string, limit?: number): Promise<Message[]>;
	getRegions(): Promise<Region[]>;
	getRegionByName(name: string): Promise<Region | undefined>;
	createRegion(region: InsertRegion): Promise<Region>;
	updateRegionMessageCount(
		regionName: string,
		count: number
	): Promise<Region | undefined>;
	getTotalMessagesCount(): Promise<number>;
	getTotalRegionsCount(): Promise<number>;
	getTodayMessagesCount(): Promise<number>;
	getRegionStats(): Promise<
		Array<{ region: string; messageCount: number; percentage: number }>
	>;
	// Update content of an existing message
	updateMessage(id: number, content: string): Promise<Message | undefined>;
	// Delete a message by id
	deleteMessage(id: number): Promise<void>;
}

export const storage: IStorage = {
	async getUser(id: number) {
		const [user] = await db.select().from(users).where(eq(users.id, id));
		return user;
	},
	async getUserByUsername(username: string) {
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.username, username));
		return user;
	},
	async createUser(userData: InsertUser) {
		const [user] = await db.insert(users).values(userData).returning();
		return user;
	},
	async getMessages(limit = 50, offset = 0) {
		// Fetch all messages regardless of approval status
		return db.select().from(messages).limit(limit).offset(offset);
	},
	async getMessagesByRegion(region: string, limit = 50) {
		return db
			.select()
			.from(messages)
			.where(
				and(eq(messages.region, region), eq(messages.isApproved, true))
			)
			.limit(limit);
	},
	async getApprovedMessages(limit = 50, offset = 0) {
		// Fetch only approved messages
		return db
			.select()
			.from(messages)
			.where(eq(messages.isApproved, true))
			.limit(limit)
			.offset(offset);
	},
	async createMessage(messageData: InsertMessage) {
		const [msg] = await db.insert(messages).values(messageData).returning();
		return msg;
	},
	async approveMessage(id: number) {
		const [msg] = await db
			.update(messages)
			.set({ isApproved: true })
			.where(eq(messages.id, id))
			.returning();
		return msg;
	},
	async likeMessage(id: number) {
		const [msg] = await db
			.update(messages)
			.set({ likes: sql`${messages.likes} + 1` })
			.where(eq(messages.id, id))
			.returning();
		return msg;
	},
	async unlikeMessage(id: number) {
		const [msg] = await db
			.update(messages)
			.set({ likes: sql`${messages.likes} - 1` })
			.where(eq(messages.id, id))
			.returning();
		return msg;
	},
	async searchMessages(query: string, limit = 50) {
		return db
			.select()
			.from(messages)
			.where(ilike(messages.content, `%${query}%`))
			.limit(limit);
	},
	async getRegions() {
		return db.select().from(regions);
	},
	async getRegionByName(name: string) {
		const [r] = await db
			.select()
			.from(regions)
			.where(eq(regions.name, name));
		return r;
	},
	async createRegion(regionData: InsertRegion) {
		const [r] = await db.insert(regions).values(regionData).returning();
		return r;
	},
	async updateRegionMessageCount(regionName: string, count: number) {
		const [r] = await db
			.update(regions)
			.set({ messageCount: count })
			.where(eq(regions.name, regionName))
			.returning();
		return r;
	},
	async getTotalMessagesCount() {
		const [{ count }] = await db
			.select({ count: sql`count(${messages.id})` })
			.from(messages);
		return Number(count);
	},
	async getTotalRegionsCount() {
		const [{ count }] = await db
			.select({ count: sql`count(${regions.id})` })
			.from(regions);
		return Number(count);
	},
	async getTodayMessagesCount() {
		// Count messages whose creation date in KST matches today's KST date
		const [{ count }] = await db
			.select({ count: sql`count(${messages.id})` })
			.from(messages).where(sql`
				((
					${messages.createdAt} + INTERVAL '9 hour'
				)::date)
				=
				((NOW() + INTERVAL '9 hour')::date)
			`);
		return Number(count);
	},
	async getRegionStats() {
		const allRegions = await db.select().from(regions);
		const totalCount = await this.getTotalMessagesCount();
		return allRegions.map((r) => {
			const count = r.messageCount ?? 0;
			return {
				region: r.name,
				messageCount: count,
				percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
			};
		});
	},
	async updateMessage(id: number, content: string) {
		const [msg] = await db
			.update(messages)
			.set({ content })
			.where(eq(messages.id, id))
			.returning();
		return msg;
	},
	async deleteMessage(id: number) {
		await db.delete(messages).where(eq(messages.id, id));
	},
};
