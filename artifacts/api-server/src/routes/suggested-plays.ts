import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { suggestedPlaysTable, playsTable, formationsTable } from "@workspace/db";
import {
  ListSuggestedPlaysQueryParams,
  ListSuggestedPlaysResponse,
  LoadSuggestedPlayParams,
} from "@workspace/api-zod";
import { eq, and, like, arrayContains } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const FIELD_WIDTH = 533;
const FIELD_HEIGHT = 1200;

router.get("/suggested-plays", async (req, res): Promise<void> => {
  const params = ListSuggestedPlaysQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.format) conditions.push(eq(suggestedPlaysTable.format, params.data.format));
  if (params.data.coverage) conditions.push(like(suggestedPlaysTable.coverageAttacked ?? "", `%${params.data.coverage}%`));
  if (params.data.concept) conditions.push(eq(suggestedPlaysTable.primaryConcept ?? "", params.data.concept));
  if (params.data.field_zone && params.data.field_zone !== "any") conditions.push(eq(suggestedPlaysTable.fieldZone, params.data.field_zone));
  if (params.data.tag) conditions.push(arrayContains(suggestedPlaysTable.tags, [params.data.tag]));
  if (params.data.search) conditions.push(like(suggestedPlaysTable.name, `%${params.data.search}%`));

  const rows = conditions.length > 0
    ? await db.select().from(suggestedPlaysTable).where(and(...conditions))
    : await db.select().from(suggestedPlaysTable);

  res.json(ListSuggestedPlaysResponse.parse(rows));
});

router.post("/suggested-plays/:id/load", async (req, res): Promise<void> => {
  const params = LoadSuggestedPlayParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const [suggested] = await db.select().from(suggestedPlaysTable).where(eq(suggestedPlaysTable.id, params.data.id));
  if (!suggested) {
    res.status(404).json({ error: "not_found", message: "Suggested play not found" });
    return;
  }

  let players: unknown[] = Array.isArray(suggested.players) ? suggested.players : [];

  if (players.length === 0 && suggested.formationId) {
    const [formation] = await db.select().from(formationsTable).where(eq(formationsTable.id, suggested.formationId));
    if (formation && Array.isArray(formation.players) && formation.players.length > 0) {
      players = (formation.players as Array<Record<string, unknown>>).map((p) => ({
        ...p,
        x: typeof p.x === "number" ? (p.x / 100) * FIELD_WIDTH : FIELD_WIDTH / 2,
        y: typeof p.y === "number" ? ((100 - (p.y as number)) / 100) * FIELD_HEIGHT : FIELD_HEIGHT / 2,
      }));
    }
  }

  const [play] = await db.insert(playsTable).values({
    id: randomUUID(),
    title: suggested.name,
    mode: suggested.mode,
    format: suggested.format,
    formationId: suggested.formationId,
    players,
    routes: Array.isArray(suggested.routes) ? suggested.routes : [],
    tags: suggested.tags,
    coverageTargets: suggested.coverageAttacked ? [suggested.coverageAttacked] : [],
    suggestedUse: suggested.idealSituation,
    notes: suggested.coachingPurpose,
    fieldZone: suggested.fieldZone === "any" ? "midfield" : suggested.fieldZone,
    difficulty: suggested.difficulty,
    primaryConcept: suggested.primaryConcept,
    isManBeater: suggested.isManBeater,
    isZoneBeater: suggested.isZoneBeater,
  }).returning();

  const { GetPlayResponse } = await import("@workspace/api-zod");
  res.status(201).json(GetPlayResponse.parse(play));
});

export default router;
