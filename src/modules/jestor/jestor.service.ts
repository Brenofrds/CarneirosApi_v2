/*--------------------------------------------------
Lógica do negócio.
Funções que interagem diretamente com o banco de da-
dos e outras funcionalidades, como a integração com 
o Jestor.

Conteúdo: Funções como listTables, listColumns, 
sendDataToJestor, etc.
*/

//codigo alterado
import jestorClient from '../../config/jestorClient';//importa o axios
import prisma from 'config/database';//importa o prisma


//lista as tabelas do banco de dados
export async function listTables() {
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'`;
  return tables.map((table) => table.table_name);
}

//lista as colunas da tabela
export async function listColumns(tableName: string) {
  const columns = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = ${tableName} AND table_schema = 'public'`;
  return columns.map((column) => column.column_name);
}

//envia todos os dados de uma tabela para o jestor
export async function sendDataToJestor(tableName: string) {
  const records = await prisma[tableName].findMany();

  for (const record of records) {
    try {
      await jestorClient.post('/object/create', record);
      console.log(`Registro enviado para a tabela ${tableName}:`, record);
    } catch (error) {
      console.error(`Erro ao enviar o registro para o Jestor:`, error);
    }
  }
}

//********************************************************************************
//********************************************************************************
import { response } from 'express';
import jestorClient from '../../config/jestorClient';

export async function fetchTelefones(page: number = 1, size: number = 10): Promise<string[]> {
  try {
    const response = await jestorClient.post('/object/list', {
      object_type: 'a3672133a5950a31442d1', // ID ou nome da tabela
      page,
      size,
      select: ['telefone'], // Campo desejado
    });

    const telefones = response.data.data.items.map((item: any) => item.telefone); // Extrai apenas os telefones
    return telefones;
  } catch (error: any) {
    console.error('Erro ao buscar telefones:', error.response?.data || error.message);
    throw new Error('Falha ao buscar telefones');
  }
}

//Cria um registro novo na tabela do Jestor
export async function jestorCreateRecord(data: any) {
  try{
    const response = await jestorClient.post('/object/create', {
        object_type: 'yhe66m7287os9_0xq_kbu',//tabela testEngNet_1
        data: {
          cpf_1: data.cpf_cnpj,
          nome: data.proprietario_principal,
          email: data.email
        },
      });
  }
  catch(error: any){
    console.error('Erro ao criar registro no Jestor', error.response?.data || error.message);
    throw new Error('Falha ao criar registro');
  }
}

//Consulta um registro pelo CPF na tabela do Jestor
export async function jestorFetchRecord(data: any) {
  try{
    const response = await jestorClient.post('/object/list', {
        object_type: 'yhe66m7287os9_0xq_kbu',//tabela testEngNet_1
        sort: '',
        page: 1,
        size: '10',
        select: ['proprietario_principal'],  //seleciona os campos tabela que quero mostrar
        filters: [{cpf_1: data.cpf_cnpj, operator: '=='}] //especifica o campo e o tipo de operação para o filtro
      });
      console.log("O proprietario existe! Nome: " + response.data.items.name);
  }
  catch(error: any){
    console.error('Erro ao criar registro no Jestor', error.response?.data || error.message);
    throw new Error('Falha ao criar registro');
  }
}
/*
async function main() {
    
    const telefones = await fetchTelefones(1, 10); // Busca telefones na página 1 com 10 registros
    console.log('Telefones encontrados:', telefones);
}
  
main();
*/