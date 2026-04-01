import { db, formationsTable, suggestedPlaysTable, playbooksTable } from "@workspace/db";
import { SEED_FORMATIONS, SEED_PLAYBOOKS, SEED_SUGGESTED_PLAYS } from "../../../artifacts/api-server/src/lib/seed-data.js";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding FlagLab database...");

  // Clear existing seed data
  await db.execute(sql`DELETE FROM suggested_plays`);
  await db.execute(sql`DELETE FROM formations`);
  await db.execute(sql`DELETE FROM playbooks WHERE id IN ('pb-red-zone', 'pb-base-offense', 'pb-7v7-offense')`);

  // Seed formations
  for (const formation of SEED_FORMATIONS) {
    await db.insert(formationsTable).values(formation).onConflictDoNothing();
  }
  console.log(`Seeded ${SEED_FORMATIONS.length} formations`);

  // Seed playbooks
  for (const pb of SEED_PLAYBOOKS) {
    await db.insert(playbooksTable).values({
      ...pb,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();
  }
  console.log(`Seeded ${SEED_PLAYBOOKS.length} playbooks`);

  // Seed suggested plays
  for (const play of SEED_SUGGESTED_PLAYS) {
    await db.insert(suggestedPlaysTable).values(play).onConflictDoNothing();
  }
  console.log(`Seeded ${SEED_SUGGESTED_PLAYS.length} suggested plays`);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
