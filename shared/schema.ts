import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  region: text("region").notNull(), // e.g., "서울특별시"
  subregion: text("subregion"), // e.g., "중구"
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  likes: integer("likes").default(0),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "서울특별시"
  code: text("code").notNull(), // region code
  messageCount: integer("message_count").default(0),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  likes: true,
  isApproved: true,
  createdAt: true,
}).extend({
  content: z.string().min(10, "메시지는 최소 10자 이상이어야 합니다.").max(500, "메시지는 500자를 초과할 수 없습니다."),
  region: z.string().min(1, "지역 정보가 필요합니다."),
  latitude: z.string().min(1, "위치 정보가 필요합니다."),
  longitude: z.string().min(1, "위치 정보가 필요합니다."),
});

export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
  messageCount: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
