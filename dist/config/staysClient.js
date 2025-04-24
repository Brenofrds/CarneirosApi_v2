"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const AUTH_HEADER = 'Basic ZDkwNDg2YzU6YjU4MTM0M2U=';
const BASE_URL = 'https://cta.stays.com.br/external/v1';
const staysClient = axios_1.default.create({
    baseURL: BASE_URL,
    headers: {
        accept: 'application/json',
        Authorization: AUTH_HEADER,
    },
});
exports.default = staysClient;
