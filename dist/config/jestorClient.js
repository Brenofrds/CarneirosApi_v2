"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_TOKEN = 'MmQ4MTk1ZmY5ZGUzYzEzce1c7be307MTY4MDAyNzE0M2UyYzk1'; // Substitua pelo seu token correto
const BASE_URL = 'https://carneirostemporada.api.jestor.com'; // Certifique-se de que este é o domínio correto
const jestorClient = axios_1.default.create({
    baseURL: BASE_URL,
    headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${API_TOKEN}`,
    },
});
exports.default = jestorClient;
