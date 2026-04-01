import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playbooksTable, playsTable, playbookPlaysTable } from "@workspace/db";
import {
  CreatePlaybookBody,
  UpdatePlaybookBody,
  UpdatePlaybookParams,
  DeletePlaybookParams,
  GetPlaybookParams,
  GetPlaybookResponse,
  UpdatePlaybookResponse,
  ListPlaybooksResponse,
  GetRecentPlaysResponse,
} from "@workspace/api-zod";
import { eq, and, asc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z as zod } from "zod/v4";

const router: IRouter = Router();

// ─── List all playbooks ───────────────────────────────────────────────────────
router.get("/playbooks", async (_req, res): Promise<void> => {
  const rows = await db.select().from(playbooksTable).orderBy(playbooksTable.createdAt);

  const withCounts = await Promise.all(
    rows.map(async (pb) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(playbookPlaysTable)
        .where(eq(playbookPlaysTable.playbookId, pb.id));
      return { ...pb, playCount: count ?? 0 };
    }),
  );

  res.json(ListPlaybooksResponse.parse(withCounts));
});

// ─── Create a playbook ────────────────────────────────────────────────────────
router.post("/playbooks", async (req, res): Promise<void> => {
  const parsed = CreatePlaybookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", message: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(playbooksTable)
    .values({ id: randomUUID(), ...parsed.data })
    .returning();

  res.status(201).json(GetPlaybookResponse.parse({ ...row, playCount: 0 }));
});

// ─── Get a playbook ───────────────────────────────────────────────────────────
router.get("/playbooks/:id", async (req, res): Promise<void> => {
  const params = GetPlaybookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(playbooksTable)
    .where(eq(playbooksTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "not_found", message: "Playbook not found" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(playbookPlaysTable)
    .where(eq(playbookPlaysTable.playbookId, row.id));

  res.json(GetPlaybookResponse.parse({ ...row, playCount: count ?? 0 }));
});

// ─── Update a playbook ────────────────────────────────────────────────────────
router.put("/playbooks/:id", async (req, res): Promise<void> => {
  const params = UpdatePlaybookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const parsed = UpdatePlaybookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", message: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(playbooksTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(playbooksTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "not_found", message: "Playbook not found" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(playbookPlaysTable)
    .where(eq(playbookPlaysTable.playbookId, row.id));

  res.json(UpdatePlaybookResponse.parse({ ...row, playCount: count ?? 0 }));
});

// ─── Duplicate a playbook ────────────────────────────────────────────────────
router.post("/playbooks/:id/duplicate", async (req, res): Promise<void> => {
  const { id } = req.params;

  const [original] = await db
    .select()
    .from(playbooksTable)
    .where(eq(playbooksTable.id, id));
  if (!original) {
    res.status(404).json({ error: "not_found", message: "Playbook not found" });
    return;
  }

  const newId = randomUUID();
  const [newPb] = await db
    .insert(playbooksTable)
    .values({
      id: newId,
      name: `${original.name} (Copy)`,
      description: original.description,
      format: original.format,
      color: original.color,
    })
    .returning();

  // Copy all play associations with same ordering
  const playLinks = await db
    .select()
    .from(playbookPlaysTable)
    .where(eq(playbookPlaysTable.playbookId, id))
    .orderBy(asc(playbookPlaysTable.position));

  if (playLinks.length > 0) {
    await db.insert(playbookPlaysTable).values(
      playLinks.map((link) => ({
        playbookId: newId,
        playId: link.playId,
        position: link.position,
      })),
    );
  }

  res.status(201).json(GetPlaybookResponse.parse({ ...newPb, playCount: playLinks.length }));
});

// ─── Delete a playbook ────────────────────────────────────────────────────────
router.delete("/playbooks/:id", async (req, res): Promise<void> => {
  const params = DeletePlaybookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  await db.delete(playbooksTable).where(eq(playbooksTable.id, params.data.id));
  res.sendStatus(204);
});

// ─── Get plays in a playbook (ordered) ───────────────────────────────────────
router.get("/playbooks/:id/plays", async (req, res): Promise<void> => {
  const { id } = req.params;

  const rows = await db
    .select({
      play: playsTable,
      position: playbookPlaysTable.position,
    })
    .from(playbookPlaysTable)
    .innerJoin(playsTable, eq(playbookPlaysTable.playId, playsTable.id))
    .where(eq(playbookPlaysTable.playbookId, id))
    .orderBy(asc(playbookPlaysTable.position));

  const plays = rows.map((r) => r.play);
  res.json(GetRecentPlaysResponse.parse(plays));
});

// ─── Add a play to a playbook ─────────────────────────────────────────────────
const AddPlayToPlaybookBody = zod.object({ playId: zod.string() });

router.post("/playbooks/:id/plays", async (req, res): Promise<void> => {
  const { id } = req.params;
  const parsed = AddPlayToPlaybookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", message: parsed.error.message });
    return;
  }

  const [pb] = await db.select().from(playbooksTable).where(eq(playbooksTable.id, id));
  if (!pb) {
    res.status(404).json({ error: "not_found", message: "Playbook not found" });
    return;
  }

  const [{ maxPos }] = await db
    .select({ maxPos: sql<number>`coalesce(max(position), -1)` })
    .from(playbookPlaysTable)
    .where(eq(playbookPlaysTable.playbookId, id));

  await db
    .insert(playbookPlaysTable)
    .values({ playbookId: id, playId: parsed.data.playId, position: (maxPos ?? -1) + 1 })
    .onConflictDoNothing();

  res.sendStatus(204);
});

// ─── Remove a play from a playbook ───────────────────────────────────────────
router.delete("/playbooks/:id/plays/:playId", async (req, res): Promise<void> => {
  const { id, playId } = req.params;

  await db
    .delete(playbookPlaysTable)
    .where(and(eq(playbookPlaysTable.playbookId, id), eq(playbookPlaysTable.playId, playId)));

  res.sendStatus(204);
});

// ─── Reorder plays in a playbook ─────────────────────────────────────────────
const ReorderPlaysBody = zod.object({ playIds: zod.array(zod.string()) });

router.put("/playbooks/:id/plays/reorder", async (req, res): Promise<void> => {
  const { id } = req.params;
  const parsed = ReorderPlaysBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", message: parsed.error.message });
    return;
  }

  await Promise.all(
    parsed.data.playIds.map((playId, position) =>
      db
        .update(playbookPlaysTable)
        .set({ position })
        .where(
          and(eq(playbookPlaysTable.playbookId, id), eq(playbookPlaysTable.playId, playId)),
        ),
    ),
  );

  res.sendStatus(204);
});

export default router;
