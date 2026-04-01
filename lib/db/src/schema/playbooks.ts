import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playbooksTable = pgTable("playbooks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  format: text("format").notNull().default("both"),
  color: text("color"),
  playCount: integer("play_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlaybookSchema = createInsertSchema(playbooksTable).omit({ createdAt: true, updatedAt: true, playCount: true });
export type InsertPlaybook = z.infer<typeof insertPlaybookSchema>;
export type Playbook = typeof playbooksTable.$inferSelect;
