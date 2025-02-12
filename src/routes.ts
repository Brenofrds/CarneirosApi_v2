import express from "express";
import { staysWebhookHandler } from "../src/modules/stays/stays.controller";

const router = express.Router();

router.post("/webhook/stays", staysWebhookHandler);

export default router;
