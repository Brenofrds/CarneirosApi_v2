import jestorClient from '../../../config/jestorClient';
import { typeProprietario } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor, getProprietariosNaoSincronizados } from '../../database/models';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const JESTOR_TB_PROPRIETARIO = 'yhe66m7287os9_0xq_kbu';

/**
 * Verifica se um proprietario com o nome e telefone fornecido já existe na tabela do Jestor.
 * @param - Nome/Telefone do proprietario a ser verificado.
 * @returns - Um boolean indicando se o proprietario já existe no Jestor.
 */

export async function verificarProprietarioNoJestor(
    nome: string, 
    telefone: string | null
) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_PROPRIETARIO, // ID da tabela no Jestor
            filters: [
                        {
                            field: 'nome_1', // Nome do campo no Jestor
                            value: nome,
                            operator: '==', // Operador para comparação
                        },
                        {
                            field: 'telefone',
                            value: telefone,
                            operator: '==',
                        },
                    ],
        });

        // Garante que items está definido antes de verificar o tamanho
        const items = response.data?.data?.items;
        /* para depuracao
        console.log("--------------------------------------------------");
        console.log('Resposta da API do Jestor:\n\n', JSON.stringify(response.data, null, 2));
        console.log("--------------------------------------------------");
        */
        if (Array.isArray(items) && items.length > 0) {
            return true; // proprietario existe
        }

        return false; // proprietario não existe
    } catch (error: any) {
        console.error('Erro ao verificar proprietario no Jestor:', error.message);
        throw new Error('Erro ao verificar proprietario no Jestor');
    }
}

/**
 * Insere um proprietario no Jestor.
 * @param proprietario - Dados do proprietario a serem inseridos.
 */
export async function inserirProprietarioNoJestor(proprietario: typeProprietario) {
 
    try {
        // nome do campo no Jestor | nome do campo no banco de dados local
        const data: any = {
            idapi: proprietario.id, // ID do banco da API EngNet
            nome_1: proprietario.nome,
            telefone: proprietario.telefone,
        };

        // Envia os dados pro Jestor
        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_PROPRIETARIO, // ID da tabela no Jestor
            data,
        });
        /* para depuracao
        console.log("--------------------------------------------------");
        console.log('Proprietario inserido no Jestor:\n\n', response.data);
        console.log("--------------------------------------------------");
        */
        return response.data; // Retorna o dado inserido

    } catch (error: any) {
        console.error('Erro ao inserir proprietario no Jestor:', error.response?.data || error.message);
        throw new Error('Erro ao inserir proprietario no Jestor');
    }
}

/**
 * Sincroniza os proprietarios não sincronizados do banco local com o Jestor.
 */
export async function sincronizarProprietario() {
    try {
        const proprietariosNaoSincronizados = await getProprietariosNaoSincronizados();

        if(proprietariosNaoSincronizados){
            for (const proprietario of proprietariosNaoSincronizados) {
                const existeNoJestor = await verificarProprietarioNoJestor(proprietario.nome, proprietario.telefone);
       
                if (!existeNoJestor) {
                    await inserirProprietarioNoJestor(proprietario);
                    console.log("--------------------------------------------------");    
                    console.log(`Proprietario: ${proprietario.nome}\nSincronizado com sucesso!`);

                } else {
                    console.log("--------------------------------------------------");
                    console.log(`Proprietario: ${proprietario.nome}\nJa existe no Jestor. Atualizado no banco local.`);
                }
                // Atualiza o status no banco local para sincronizado
                await atualizaCampoSincronizadoNoJestor('proprietario', proprietario.id, proprietario.nome ?? undefined, proprietario.telefone ?? undefined);
            }
        }
    } catch (error: any) {
        console.error('Erro ao sincronizar proprietario:', error.message);
    }
}

/*funcao de teste
(async () => {
  await sincronizarProprietario();
})();
*/