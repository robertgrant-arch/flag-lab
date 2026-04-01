import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playsTable = pgTable("plays", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  mode: text("mode").notNull().default("offense"),
  format: text("format").notNull().default("5v5"),
  formationId: text("formation_id"),
  playbookId: text("playbook_id"),
  players: jsonb("players").notNull().default([]),
  routes: jsonb("routes").notNull().default([]),
  notes: text("notes"),
  tags: text("tags").array().notNull().default([]),
  suggestedUse: text("suggested_use"),
  coverageTargets: text("coverage_targets").array().notNull().default([]),
  fieldZone: text("field_zone"),
  difficulty: text("difficulty"),
  primaryConcept: text("primary_concept"),
  isManBeater: boolean("is_man_beater").notNull().default(false),
  isZoneBeater: boolean("is_zone_beater").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlaySchema = createInsertSchema(playsTable).omit({ createdAt: true, updatedAt: true });
export type InsertPlay = z.infer<typeof insertPlaySchema>;
export type Play = typeof playsTable.$inferSelect;
