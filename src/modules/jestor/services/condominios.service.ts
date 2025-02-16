import jestorClient from '../../../config/jestorClient';
import { typeCondominio } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor, getCondominiosNaoSincronizados } from '../../database/models';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const JESTOR_TB_CONDOMINIO = 'w_zk_k73oj_eld8yvjn0u';

/**
 * Verifica se um condominio com o nome fornecido já existe na tabela do Jestor.
 * @param - idExterno/SKU do condominio a ser verificado.
 * @returns - Um boolean indicando se o condominio já existe no Jestor.
 */

export async function verificarCondominioNoJestor(
    idExterno: string,
    sku: string | null, 
) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_CONDOMINIO, // ID da tabela no Jestor
            filters: [
                        {
                            field: 'idexterno', // Nome do campo no Jestor
                            value: idExterno,
                            operator: '==', // Operador para comparação
                        },
                        {
                            field: 'sku', // nome interno do condominio
                            value: sku,
                            operator: '==',
                        },
            ],
        });

        // Garante que items está definido antes de verificar o tamanho
        const items = response.data?.data?.items;
        /*
        console.log("--------------------------------------------------");
        console.log('Resposta da API do Jestor:\n\n', JSON.stringify(response.data, null, 2));
        console.log("--------------------------------------------------");
        */
        if (Array.isArray(items) && items.length > 0) {
            return true; // Condominio existe
        }

        return false; // Condominio não existe
    } catch (error: any) {
        console.error('Erro ao verificar condominio no Jestor:', error.message);
        throw new Error('Erro ao verificar condominio no Jestor');
    }
}

/**
 * Insere um condominio no Jestor.
 * @param condominio - Dados do condominio a serem inseridos.
 */
export async function inserirCondominioNoJestor(condominio: typeCondominio) {
 
    try {
        // nome do campo no Jestor | nome do campo no banco de dados local
        const data: any = {
            idbdengnet: condominio.id, // ID do banco da API EngNet
            idexterno: condominio.idExterno,
            idstays: condominio.idStays,
            skuinternalname: condominio.sku,
            regiao: condominio.regiao,
        };

        // Envia os dados pro Jestor
        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_CONDOMINIO, // ID da tabela no Jestor
            data,
        });
        /*
        console.log("--------------------------------------------------");
        console.log('condominio inserido no Jestor:\n\n', response.data);
        console.log("--------------------------------------------------");
        */
        return response.data; // Retorna o dado inserido

    } catch (error: any) {
        console.error('Erro ao inserir condominio no Jestor:', error.response?.data || error.message);
        throw new Error('Erro ao inserir condominio no Jestor');
    }
}

/**
 * Sincroniza os condominios não sincronizados do banco local com o Jestor.
 */
export async function sincronizarCondominio() {
    try {
        const condominiosNaoSincronizados = await getCondominiosNaoSincronizados();

        if(condominiosNaoSincronizados){
            for (const condominio of condominiosNaoSincronizados) {
                const existeNoJestor = await verificarCondominioNoJestor(condominio.idExterno, condominio.sku);
       
                if (!existeNoJestor) {
                    await inserirCondominioNoJestor(condominio);

                    console.log("--------------------------------------------------");    
                    console.log(`condominio: ${condominio.idExterno}\nSincronizado com sucesso!`);
                    //console.log("--------------------------------------------------");
                } else {

                    console.log("--------------------------------------------------");
                    console.log(`condominio: ${condominio.idExterno}\nJa existe no Jestor. Atualizado no banco local.`);
                    //console.log("--------------------------------------------------");
                }
                // Atualiza o status no banco local para sincronizado
                await atualizaCampoSincronizadoNoJestor('condominio', condominio.idExterno);
            }
        }
    } catch (error: any) {
        console.error('Erro ao sincronizar condominio:', error.message);
    }
}

/*funcao de teste*/
(async () => {
  await sincronizarCondominio();
})();