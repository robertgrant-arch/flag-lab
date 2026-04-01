import { pgTable, text, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const suggestedPlaysTable = pgTable("suggested_plays", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  coachingPurpose: text("coaching_purpose").notNull(),
  idealSituation: text("ideal_situation").notNull(),
  format: text("format").notNull(),
  mode: text("mode").notNull(),
  tags: text("tags").array().notNull().default([]),
  coverageAttacked: text("coverage_attacked"),
  primaryConcept: text("primary_concept"),
  difficulty: text("difficulty"),
  fieldZone: text("field_zone").notNull().default("any"),
  isManBeater: boolean("is_man_beater").notNull().default(false),
  isZoneBeater: boolean("is_zone_beater").notNull().default(false),
  players: jsonb("players").notNull().default([]),
  routes: jsonb("routes").notNull().default([]),
  formationId: text("formation_id"),
});

export const insertSuggestedPlaySchema = createInsertSchema(suggestedPlaysTable);
export type InsertSuggestedPlay = z.infer<typeof insertSuggestedPlaySchema>;
export type SuggestedPlay = typeof suggestedPlaysTable.$inferSelect;
