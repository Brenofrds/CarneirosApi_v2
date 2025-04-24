import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import routes from "./routes";

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rotas principais
app.use("/webhook", routes);

export default app;