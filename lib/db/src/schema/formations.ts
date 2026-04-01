import { pgTable, text, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const formationsTable = pgTable("formations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  format: text("format").notNull(),
  mode: text("mode").notNull(),
  description: text("description"),
  players: jsonb("players").notNull().default([]),
});

export const insertFormationSchema = createInsertSchema(formationsTable);
export type InsertFormation = z.infer<typeof insertFormationSchema>;
export type Formation = typeof formationsTable.$inferSelect;
