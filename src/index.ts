import express from "express";
import bodyParser from "body-parser";
import router from "./routes"; // Importa as rotas

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para interpretar JSON
app.use(bodyParser.json());

// Usa as rotas definidas no arquivo routes.ts
app.use(router);

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
