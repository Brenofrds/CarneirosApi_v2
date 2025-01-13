/*--------------------------------------------------
Função: Arquivo PRINCIPAL onde você configura o ser-
vidor Express e a estrutura da API. Aqui você impor-
ta as rotas e define a estrutura do servidor.

Conteúdo: Configuração do Express, middlewares, ro-
tas, etc.
*/

//codigo exemplo
import express, { Express } from 'express';
import databaseRoutes from './routes/databaseRoutes';

const app: Express = express();
app.use(express.json());

app.use('/api', databaseRoutes);

export default app;
