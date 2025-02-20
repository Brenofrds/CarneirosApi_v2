import jestorClient from '../../../config/jestorClient';
import { typeAgente } from '../jestor.types';
import { atualizaCampoSincronizadoNoJestor, getAgentesNaoSincronizados } from '../../database/models';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const JESTOR_TB_AGENTE = '1jxekmijxza61ygtgadfi';

/**
 * Verifica se um agente com o nome fornecido já existe na tabela do Jestor.
 * @param nome - Nome do agente a ser verificado.
 * @returns - Um boolean indicando se o agente já existe no Jestor.
 */

export async function verificarAgenteNoJestor(nome: string) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_AGENTE, // ID da tabela no Jestor
            filters: [
                {
                    field: 'name', // Nome do campo no Jestor
                    value: nome,
                    operator: '==', // Operador para comparação
                },
            ],
        });
        
        console.log("--------------------------------------------------");
        console.log('Resposta da API do Jestor:\n\n', JSON.stringify(response.data, null, 2));
        console.log("--------------------------------------------------");
        // Garante que items está definido antes de verificar o tamanho
        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            return true; // Agente existe
        }

        return false; // Agente não existe
    } catch (error: any) {
        console.error('Erro ao verificar agente no Jestor:', error.message);
        throw new Error('Erro ao verificar agente no Jestor');
    }
}

/**
 * Insere um agente no Jestor.
 * @param agente - Dados do agente a serem inseridos.
 */
export async function inserirAgenteNoJestor(agente: typeAgente) {

    try {
        // nome do campo no Jestor | nome do campo no banco de dados local
        const data: any = {
            id_api_engnet: agente.id,
            id_externo: agente.idExterno,
            name: agente.nome,
            //: reservas,
        }

        // Envia os dados pro Jestor
        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_AGENTE, // ID da tabela no Jestor
            data,
        });

        console.log("--------------------------------------------------");
        console.log('Agente inserido no Jestor:\n\n', response.data);
        console.log("--------------------------------------------------");
        return response.data; // Retorna o dado inserido

    } catch (error: any) {
        console.error('Erro ao inserir agente no Jestor:', error.response?.data || error.message);
        throw new Error('Erro ao inserir agente no Jestor');
    }
}

/**
 * Sincroniza os agentes não sincronizados do banco local com o Jestor.
 */
export async function sincronizarAgente() {
    try {
        const agentesNaoSincronizados = await getAgentesNaoSincronizados();
        
        if(agentesNaoSincronizados){
            for (const agente of agentesNaoSincronizados) {
                const existeNoJestor = await verificarAgenteNoJestor(agente.nome);

                if (!existeNoJestor) {
                    await inserirAgenteNoJestor(agente);
                    
                    console.log("--------------------------------------------------");
                    console.log(`Agente ${agente.nome}\nSincronizado com sucesso!`);
                    console.log("--------------------------------------------------");
                } else {
                    console.log("--------------------------------------------------");
                    console.log(`Agente: ${agente.nome}\nJa existe no Jestor. Atualizado no banco local.`);
                    console.log("--------------------------------------------------");
                }
                // Atualiza o status no banco local para sincronizado
                await atualizaCampoSincronizadoNoJestor('agente', agente.idExterno);
            }
        }
    } catch (error: any) {
        console.error('Erro ao sincronizar agentes:', error.message);
    }
}

/*funcao de teste
(async () => {
  await sincronizarAgente();
})();
*/