/*--------------------------------------------------
Função: Este arquivo será responsável por expor as 
funções da API. Aqui, você pode CRIAR os ENDPOINTS 
da API que chamam os serviços que lidam com a lógica 
de negócios.

Explicação: Funções para manipular as requisições 
HTTP e chamar os serviços adequados.
*/

//codigo exemplo
import { Request, Response } from 'express';
import { listTables, listColumns, sendDataToJestor } from '../services/databaseService';

export const getTables = async (req: Request, res: Response) => {
  try {
    const tables = await listTables();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar tabelas' });
  }
};

export const getColumns = async (req: Request, res: Response) => {
  const { tableName } = req.params;
  try {
    const columns = await listColumns(tableName);
    res.json(columns);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar colunas' });
  }
};

export const sendToJestor = async (req: Request, res: Response) => {
  const { tableName } = req.params;
  try {
    await sendDataToJestor(tableName);
    res.status(200).send('Dados enviados para o Jestor com sucesso');
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar dados para o Jestor' });
  }
};
