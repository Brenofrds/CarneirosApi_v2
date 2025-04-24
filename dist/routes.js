"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stays_controller_1 = require("./modules/stays/stays.controller");
const router = express_1.default.Router();
router.post("/webhook/stays", stays_controller_1.staysWebhookHandler);
exports.default = router;
