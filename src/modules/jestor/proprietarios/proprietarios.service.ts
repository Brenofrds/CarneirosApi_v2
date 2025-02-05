import jestorClient from '../../../config/jestorClient';
import prisma from '../../../config/database';
import { getProprietariosNaoSincronizados } from '../../database/models';

/**
 * Verifica se um proprietário com o CPF fornecido já existe na tabela testEngNet_1 no Jestor.
 * @param cpf_cnpj - CPF do proprietário a ser verificado.
 * @returns - Um boolean indicando se o proprietário já existe no Jestor.
 */
export async function verificarProprietarioNoJestor(cpf_cnpj: string) {
    try {
      const response = await jestorClient.post('/object/list', {
        object_type: 'yhe66m7287os9_0xq_kbu', // Código da tabela
        filters: [
          {
            field: 'cpf_1', // Certifique-se de usar o nome correto do campo
            value: cpf_cnpj,
            operator: '==', // Operador para comparação
          },
        ],
      });
  
      console.log('Resposta da API do Jestor:', JSON.stringify(response.data, null, 2));
  
      // Garante que items está definido antes de verificar o tamanho
      const items = response.data?.data?.items;
  
      if (Array.isArray(items) && items.length > 0) {
        return true; // Proprietário existe
      }
  
      return false; // Proprietário não existe
    } catch (error: any) {
      console.error('Erro ao verificar proprietário no Jestor:', error.message);
      throw new Error('Erro ao verificar proprietário no Jestor');
    }
}

export async function inserirProprietarioNoJestor(proprietario: {
  id: number; // Adicionei o campo 'id' para representar o ID no banco local
  cpf_cnpj: string;
  proprietario_principal: string;
  email: string;
}) {
  try {
      const response = await jestorClient.post('/object/create', {
          object_type: 'yhe66m7287os9_0xq_kbu', // Identificador da tabela no Jestor
          data: {
              id_api_engnet: proprietario.id, // ID do banco da API EngNet
              cpf_1: proprietario.cpf_cnpj, // Nome do campo no Jestor
              nome: proprietario.proprietario_principal,
              email: proprietario.email,
          },
      });

      console.log('Proprietário inserido no Jestor:', response.data);
      return response.data; // Retorna o dado inserido
  } catch (error: any) {
      console.error('Erro ao inserir proprietário no Jestor:', error.response?.data || error.message);
      throw new Error('Erro ao inserir proprietário no Jestor');
  }
}



export async function sincronizarProprietarios() {
    try {
      const proprietariosNaoSincronizados = await getProprietariosNaoSincronizados();
  
      for (const proprietario of proprietariosNaoSincronizados) {
        const existeNoJestor = await verificarProprietarioNoJestor(proprietario.cpf_cnpj);
  
        if (!existeNoJestor) {
          const registroJestor = await inserirProprietarioNoJestor({
            id: proprietario.id,
            cpf_cnpj: proprietario.cpf_cnpj,
            proprietario_principal: proprietario.proprietario_principal,
            email: proprietario.email,
          });
  
          // Atualiza o status no banco local
          await prisma.proprietario.update({
            where: { id: proprietario.id },
            data: { sincronizadoNoJestor: true },
          });
  
          console.log(`Proprietário ${proprietario.proprietario_principal} sincronizado com sucesso!`);
        } else {
          // Se já existe no Jestor, atualiza o status no banco local para sincronizado
          await prisma.proprietario.update({
            where: { id: proprietario.id },
            data: { sincronizadoNoJestor: true },
          });
  
          console.log(`Proprietário ${proprietario.proprietario_principal} já existe no Jestor e foi atualizado no banco local.`);
        }
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar proprietários:', error.message);
    }
  }