import jestorClient from '../../../config/jestorClient';
import { typeBloqueio } from '../jestor.types';
import { atualizaCampoSincronizadoNoJestor, getBloqueiosNaoSincronizados } from '../../database/models';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const JESTOR_TB_BLOQUEIO = 'e0bldzqfovxjs42u67wqk';

/**
 * Verifica se um agente com o nome fornecido já existe na tabela do Jestor.
 * @param nome - Nome do agente a ser verificado.
 * @returns - Um boolean indicando se o agente já existe no Jestor.
 */

export async function verificarBloqueioNoJestor(nome: string) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_BLOQUEIO, // ID da tabela no Jestor
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
            return true; // Bloqueio existe
        }

        return false; // Bloqueio não existe
    } catch (error: any) {
        console.error('Erro ao verificar Bloqueio no Jestor:', error.message);
        throw new Error('Erro ao verificar Bloqueio no Jestor');
    }
}

/**
 * Insere um Bloqueio no Jestor.
 * @param Bloqueio - Dados do Bloqueio a serem inseridos.
 */
export async function inserirBloqueioNoJestor(bloqueio: typeBloqueio) {

    try {
        // nome do campo no Jestor | nome do campo no banco de dados local
        const data: any = {
            idapi: bloqueio.id,
            idexterno_1: bloqueio.idExterno,
            localizador: bloqueio.localizador,
            checkin: bloqueio.checkIn,
            checkout: bloqueio.checkOut,
            horacheckin: bloqueio.horaCheckIn,
            horacheckout: bloqueio.horaCheckOut,
            notainterna: bloqueio.notaInterna,
            imovelid: bloqueio.imovelId,
        }

        // Envia os dados pro Jestor
        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_BLOQUEIO, // ID da tabela no Jestor
            data,
        });

        console.log("--------------------------------------------------");
        console.log('Bloqueio inserido no Jestor:\n\n', response.data);
        console.log("--------------------------------------------------");
        return response.data; // Retorna o dado inserido

    } catch (error: any) {
        console.error('Erro ao inserir Bloqueio no Jestor:', error.response?.data || error.message);
        throw new Error('Erro ao inserir Bloqueio no Jestor');
    }
}

/**
 * Sincroniza os Bloqueios não sincronizados do banco local com o Jestor.
 */
export async function sincronizarBloqueio() {
    try {
        const bloqueiosNaoSincronizados = await getBloqueiosNaoSincronizados();
        
        if(bloqueiosNaoSincronizados){
            for (const bloqueio of bloqueiosNaoSincronizados) {
                const existeNoJestor = await verificarBloqueioNoJestor(bloqueio.idExterno);

                if (!existeNoJestor) {
                    await inserirBloqueioNoJestor(bloqueio);
                    
                    console.log("--------------------------------------------------");
                    console.log(`Bloqueio ${bloqueio.idExterno}\nSincronizado com sucesso!`);
                    console.log("--------------------------------------------------");
                } else {
                    console.log("--------------------------------------------------");
                    console.log(`Bloqueio: ${bloqueio.idExterno}\nJa existe no Jestor. Atualizado no banco local.`);
                    console.log("--------------------------------------------------");
                }
                // Atualiza o status no banco local para sincronizado
                await atualizaCampoSincronizadoNoJestor('bloqueio', bloqueio.idExterno);
            }
        }
    } catch (error: any) {
        console.error('Erro ao sincronizar Canais:', error.message);
    }
}

/*funcao de teste*/
(async () => {
  await sincronizarBloqueio();
})();
