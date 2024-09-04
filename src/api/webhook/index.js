import { Router } from "express";
import { webhookHandler } from "./webhook.controller.js";

const router = Router()

router.post("/receive", webhookHandler);

export default router