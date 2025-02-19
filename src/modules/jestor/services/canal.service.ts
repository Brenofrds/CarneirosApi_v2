import jestorClient from '../../../config/jestorClient';
import { typeCanal } from '../jestor.types';
import { atualizaCampoSincronizadoNoJestor, getCanaisNaoSincronizados } from '../../database/models';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const JESTOR_TB_CANAL = '1gr5oeddpkkkxjula510g';

/**
 * Verifica se um agente com o nome fornecido já existe na tabela do Jestor.
 * @param nome - Nome do agente a ser verificado.
 * @returns - Um boolean indicando se o agente já existe no Jestor.
 */

export async function verificarCanalNoJestor(nome: string) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_CANAL, // ID da tabela no Jestor
            filters: [
                {
                    field: 'idexterno', // Nome do campo no Jestor
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
            return true; // Canal existe
        }

        return false; // Canal não existe
    } catch (error: any) {
        console.error('Erro ao verificar Canal no Jestor:', error.message);
        throw new Error('Erro ao verificar Canal no Jestor');
    }
}

/**
 * Insere um Canal no Jestor.
 * @param Canal - Dados do Canal a serem inseridos.
 */
export async function inserirCanalNoJestor(canal: typeCanal) {

    try {
        // nome do campo no Jestor | nome do campo no banco de dados local
        const data: any = {
            idbdapi: canal.id,
            idexterno: canal.idExterno,
            titulo: canal.titulo,
        }

        // Envia os dados pro Jestor
        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_CANAL, // ID da tabela no Jestor
            data,
        });

        console.log("--------------------------------------------------");
        console.log('Canal inserido no Jestor:\n\n', response.data);
        console.log("--------------------------------------------------");
        return response.data; // Retorna o dado inserido

    } catch (error: any) {
        console.error('Erro ao inserir Canal no Jestor:', error.response?.data || error.message);
        throw new Error('Erro ao inserir Canal no Jestor');
    }
}

/**
 * Sincroniza os Canals não sincronizados do banco local com o Jestor.
 */
export async function sincronizarCanal() {
    try {
        const canaisNaoSincronizados = await getCanaisNaoSincronizados();
        
        if(canaisNaoSincronizados){
            for (const canal of canaisNaoSincronizados) {
                const existeNoJestor = await verificarCanalNoJestor(canal.idExterno);

                if (!existeNoJestor) {
                    await inserirCanalNoJestor(canal);
                    
                    console.log("--------------------------------------------------");
                    console.log(`Canal ${canal.idExterno}\nSincronizado com sucesso!`);
                    console.log("--------------------------------------------------");
                } else {
                    console.log("--------------------------------------------------");
                    console.log(`Canal: ${canal.idExterno}\nJa existe no Jestor. Atualizado no banco local.`);
                    console.log("--------------------------------------------------");
                }
                // Atualiza o status no banco local para sincronizado
                await atualizaCampoSincronizadoNoJestor('canal', canal.idExterno);
            }
        }
    } catch (error: any) {
        console.error('Erro ao sincronizar Canais:', error.message);
    }
}

/*funcao de teste*/
(async () => {
  await sincronizarCanal();
})();
