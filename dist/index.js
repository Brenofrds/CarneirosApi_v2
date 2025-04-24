"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = __importDefault(require("./routes")); // Importa as rotas
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware para interpretar JSON
app.use(body_parser_1.default.json());
// Usa as rotas definidas no arquivo routes.ts
app.use(routes_1.default);
// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
