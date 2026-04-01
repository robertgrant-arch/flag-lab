import { pgTable, text, integer, primaryKey } from "drizzle-orm/pg-core";
import { playbooksTable } from "./playbooks";
import { playsTable } from "./plays";

export const playbookPlaysTable = pgTable(
  "playbook_plays",
  {
    playbookId: text("playbook_id")
      .notNull()
      .references(() => playbooksTable.id, { onDelete: "cascade" }),
    playId: text("play_id")
      .notNull()
      .references(() => playsTable.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.playbookId, table.playId] })],
);

export type PlaybookPlay = typeof playbookPlaysTable.$inferSelect;
