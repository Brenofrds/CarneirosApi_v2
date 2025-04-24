import express from "express";
import { staysWebhookHandler } from "./modules/stays/stays.controller";

const router = express.Router();

router.post("/webhook/stays", staysWebhookHandler);

export default router;
