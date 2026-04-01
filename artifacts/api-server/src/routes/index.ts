import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playsRouter from "./plays";
import playbooksRouter from "./playbooks";
import formationsRouter from "./formations";
import suggestedPlaysRouter from "./suggested-plays";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playsRouter);
router.use(playbooksRouter);
router.use(formationsRouter);
router.use(suggestedPlaysRouter);
router.use(dashboardRouter);

export default router;
