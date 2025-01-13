/*--------------------------------------------------
Função: Define as rotas da API que vão chamar os 
controllers. Aqui você define os ENDPOINTS para lis-
tar tabelas, colunas e enviar dados para o Jestor.

Conteúdo: Arquivo com as definições de rotas para a 
API.
*/

//codigo exemplo
import { Router } from 'express';
import { getTables, getColumns, sendToJestor } from '../controllers/databaseController';

const router = Router();

router.get('/tables', getTables);
router.get('/tables/:tableName/columns', getColumns);
router.post('/tables/:tableName/send-to-jestor', sendToJestor);

export default router;
