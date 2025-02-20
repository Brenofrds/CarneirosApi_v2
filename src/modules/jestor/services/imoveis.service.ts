import jestorClient from '../../../config/jestorClient';
import { typeImovel } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor, getImoveisNaoSincronizados } from '../../database/models';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const JESTOR_TB_IMOVEL = 'oplicg48civ1tjt96g6e7';

/**
 * Verifica se um imovel com o nome fornecido já existe na tabela do Jestor.
 * @param - idExterno/SKU do imovel a ser verificado.
 * @returns - Um boolean indicando se o imovel já existe no Jestor.
 */

export async function verificarImovelNoJestor(
    idExterno: string,
    sku: string | null, 
) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_IMOVEL, // ID da tabela no Jestor
            filters: [
                        {
                            field: 'idexterno', // Nome do campo no Jestor
                            value: idExterno,
                            operator: '==', // Operador para comparação
                        },
                        {
                            field: 'sku', // nome interno do imovel
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
            return true; // Imovel existe
        }

        return false; // Imovel não existe
    } catch (error: any) {
        console.error('Erro ao verificar imovel no Jestor:', error.message);
        throw new Error('Erro ao verificar imovel no Jestor');
    }
}

/**
 * Insere um imovel no Jestor.
 * @param imovel - Dados do imovel a serem inseridos.
 */
export async function inserirImovelNoJestor(imovel: typeImovel) {
 
    try {
        // nome do campo no Jestor | nome do campo no banco de dados local
        const data: any = {
            idbdengnet: imovel.id, // ID do banco da API EngNet
            idexterno: imovel.idExterno,
            idstays: imovel.idStays,
            sku: imovel.sku,
            status_1: imovel.status,
            idcondominiostays: imovel.idCondominioStays,
        };

        // Envia os dados pro Jestor
        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_IMOVEL, // ID da tabela no Jestor
            data,
        });
        /*
        console.log("--------------------------------------------------");
        console.log('Imovel inserido no Jestor:\n\n', response.data);
        console.log("--------------------------------------------------");
        */
        return response.data; // Retorna o dado inserido

    } catch (error: any) {
        console.error('Erro ao inserir imovel no Jestor:', error.response?.data || error.message);
        throw new Error('Erro ao inserir imovel no Jestor');
    }
}

/**
 * Sincroniza os imovels não sincronizados do banco local com o Jestor.
 */
export async function sincronizarImovel() {
    try {
        const imoveisNaoSincronizados = await getImoveisNaoSincronizados();

        if(imoveisNaoSincronizados){
            for (const imovel of imoveisNaoSincronizados) {
                const existeNoJestor = await verificarImovelNoJestor(imovel.idExterno, imovel.sku);
       
                if (!existeNoJestor) {
                    await inserirImovelNoJestor(imovel);

                    console.log("--------------------------------------------------");    
                    console.log(`Imovel: ${imovel.idExterno}\nSincronizado com sucesso!`);
                    //console.log("--------------------------------------------------");
                } else {

                    console.log("--------------------------------------------------");
                    console.log(`Imovel: ${imovel.idExterno}\nJa existe no Jestor. Atualizado no banco local.`);
                    //console.log("--------------------------------------------------");
                }
                // Atualiza o status no banco local para sincronizado
                await atualizaCampoSincronizadoNoJestor('imovel', imovel.idExterno);
            }
        }
    } catch (error: any) {
        console.error('Erro ao sincronizar imovel:', error.message);
    }
}

//funcao de teste
(async () => {
  await sincronizarImovel();
})();
