import { Router } from "express";
import { healthcheckHandler } from "./healthcheck.controller.js";

const router = Router();

router.get('/', healthcheckHandler);

export default router