import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { formationsTable } from "@workspace/db";
import {
  ListFormationsQueryParams,
  ListFormationsResponse,
} from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/formations", async (req, res): Promise<void> => {
  const params = ListFormationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.format) conditions.push(eq(formationsTable.format, params.data.format));
  if (params.data.mode) conditions.push(eq(formationsTable.mode, params.data.mode));

  const rows = conditions.length > 0
    ? await db.select().from(formationsTable).where(and(...conditions))
    : await db.select().from(formationsTable);

  res.json(ListFormationsResponse.parse(rows));
});

export default router;
