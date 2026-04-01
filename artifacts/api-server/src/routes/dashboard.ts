import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playsTable, playbooksTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRecentPlaysQueryParams,
  GetRecentPlaysResponse,
  GetPlaysByFormationResponse,
} from "@workspace/api-zod";
import { eq, gte, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [totalPlaysRow] = await db.select({ count: sql<number>`count(*)::int` }).from(playsTable);
  const [totalPlaybooksRow] = await db.select({ count: sql<number>`count(*)::int` }).from(playbooksTable);
  const [offensiveRow] = await db.select({ count: sql<number>`count(*)::int` }).from(playsTable).where(eq(playsTable.mode, "offense"));
  const [defensiveRow] = await db.select({ count: sql<number>`count(*)::int` }).from(playsTable).where(eq(playsTable.mode, "defense"));
  const [fiveRow] = await db.select({ count: sql<number>`count(*)::int` }).from(playsTable).where(eq(playsTable.format, "5v5"));
  const [sevenRow] = await db.select({ count: sql<number>`count(*)::int` }).from(playsTable).where(eq(playsTable.format, "7v7"));
  const [redZoneRow] = await db.select({ count: sql<number>`count(*)::int` }).from(playsTable).where(eq(playsTable.fieldZone, "red_zone"));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const [recentRow] = await db.select({ count: sql<number>`count(*)::int` }).from(playsTable).where(gte(playsTable.updatedAt, sevenDaysAgo));

  const summary = {
    totalPlays: totalPlaysRow?.count ?? 0,
    totalPlaybooks: totalPlaybooksRow?.count ?? 0,
    offensivePlays: offensiveRow?.count ?? 0,
    defensivePlays: defensiveRow?.count ?? 0,
    playsBy5v5: fiveRow?.count ?? 0,
    playsBy7v7: sevenRow?.count ?? 0,
    redZonePlays: redZoneRow?.count ?? 0,
    recentActivity: recentRow?.count ?? 0,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/recent-plays", async (req, res): Promise<void> => {
  const params = GetRecentPlaysQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 5) : 5;

  const rows = await db.select().from(playsTable)
    .orderBy(sql`${playsTable.updatedAt} DESC`)
    .limit(limit);

  res.json(GetRecentPlaysResponse.parse(rows));
});

router.get("/dashboard/plays-by-formation", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      formationId: playsTable.formationId,
      count: sql<number>`count(*)::int`,
    })
    .from(playsTable)
    .groupBy(playsTable.formationId);

  const result = rows
    .filter((r) => r.formationId != null)
    .map((r) => ({
      formationId: r.formationId ?? "unknown",
      formationName: r.formationId ?? "Unknown",
      count: r.count,
    }));

  res.json(GetPlaysByFormationResponse.parse(result));
});

export default router;
