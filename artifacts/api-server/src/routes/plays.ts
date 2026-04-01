import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playsTable, playbooksTable } from "@workspace/db";
import {
  CreatePlayBody,
  UpdatePlayBody,
  UpdatePlayParams,
  DeletePlayParams,
  GetPlayParams,
  GetPlayResponse,
  UpdatePlayResponse,
  ListPlaysQueryParams,
  ListPlaysResponse,
  DuplicatePlayParams,
} from "@workspace/api-zod";
import { eq, and, like, arrayContains, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/plays", async (req, res): Promise<void> => {
  const params = ListPlaysQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.playbook_id) conditions.push(eq(playsTable.playbookId, params.data.playbook_id));
  if (params.data.format) conditions.push(eq(playsTable.format, params.data.format));
  if (params.data.mode) conditions.push(eq(playsTable.mode, params.data.mode));
  if (params.data.field_zone) conditions.push(eq(playsTable.fieldZone, params.data.field_zone));
  if (params.data.search) conditions.push(like(playsTable.title, `%${params.data.search}%`));
  if (params.data.tag) conditions.push(arrayContains(playsTable.tags, [params.data.tag]));

  const rows = conditions.length > 0
    ? await db.select().from(playsTable).where(and(...conditions)).orderBy(sql`${playsTable.updatedAt} DESC`)
    : await db.select().from(playsTable).orderBy(sql`${playsTable.updatedAt} DESC`);

  res.json(ListPlaysResponse.parse(rows));
});

router.post("/plays", async (req, res): Promise<void> => {
  const parsed = CreatePlayBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", message: parsed.error.message });
    return;
  }

  const [row] = await db.insert(playsTable).values({
    id: randomUUID(),
    players: parsed.data.players ?? [],
    routes: parsed.data.routes ?? [],
    tags: parsed.data.tags ?? [],
    coverageTargets: parsed.data.coverageTargets ?? [],
    isManBeater: parsed.data.isManBeater ?? false,
    isZoneBeater: parsed.data.isZoneBeater ?? false,
    ...parsed.data,
  }).returning();

  // Update playbook count
  if (row.playbookId) {
    await db.execute(sql`UPDATE playbooks SET play_count = play_count + 1 WHERE id = ${row.playbookId}`);
  }

  res.status(201).json(GetPlayResponse.parse(row));
});

router.get("/plays/:id", async (req, res): Promise<void> => {
  const params = GetPlayParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const [row] = await db.select().from(playsTable).where(eq(playsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "not_found", message: "Play not found" });
    return;
  }

  res.json(GetPlayResponse.parse(row));
});

router.put("/plays/:id", async (req, res): Promise<void> => {
  const params = UpdatePlayParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const parsed = UpdatePlayBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", message: parsed.error.message });
    return;
  }

  const [row] = await db.update(playsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(playsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "not_found", message: "Play not found" });
    return;
  }

  res.json(UpdatePlayResponse.parse(row));
});

router.delete("/plays/:id", async (req, res): Promise<void> => {
  const params = DeletePlayParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const [deleted] = await db.delete(playsTable)
    .where(eq(playsTable.id, params.data.id))
    .returning();

  if (deleted?.playbookId) {
    await db.execute(sql`UPDATE playbooks SET play_count = GREATEST(play_count - 1, 0) WHERE id = ${deleted.playbookId}`);
  }

  res.sendStatus(204);
});

router.post("/plays/:id/duplicate", async (req, res): Promise<void> => {
  const params = DuplicatePlayParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const [original] = await db.select().from(playsTable).where(eq(playsTable.id, params.data.id));
  if (!original) {
    res.status(404).json({ error: "not_found", message: "Play not found" });
    return;
  }

  const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = original;
  const [copy] = await db.insert(playsTable).values({
    ...rest,
    id: randomUUID(),
    title: `${original.title} (Copy)`,
  }).returning();

  res.status(201).json(GetPlayResponse.parse(copy));
});

export default router;
