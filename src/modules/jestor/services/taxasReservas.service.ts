import jestorClient from '../../../config/jestorClient';
import { typeTaxaReserva } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor, getTaxasReservasNaoSincronizados } from '../../database/models';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const JESTOR_TB_TAXARESERVA = '7l02yg9daf48d5cfmzbsm';

/**
 * Verifica se um taxaReserva com o id e nome fornecido já existe na tabela do Jestor.
 * @param - idExterno/SKU do taxaReserva a ser verificado.
 * @returns - Um boolean indicando se o taxaReserva já existe no Jestor.
 */

export async function verificarTaxaReservaNoJestor(
    id: string | number,
    nome: string | null, 
) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_TAXARESERVA, // ID da tabela no Jestor
            filters: [
                        {
                            field: 'idbdapi', // Nome do campo no Jestor
                            value: id,
                            operator: '==', // Operador para comparação
                        },
                        {
                            field: 'nometaxa', // nome interno do taxaReserva
                            value: nome,
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
            return true; // taxaReserva existe
        }

        return false; // taxaReserva não existe
    } catch (error: any) {
        console.error('Erro ao verificar taxaReserva no Jestor:', error.message);
        throw new Error('Erro ao verificar taxaReserva no Jestor');
    }
}

/**
 * Insere um taxaReserva no Jestor.
 * @param taxaReserva - Dados do taxaReserva a serem inseridos.
 */
export async function inserirTaxaReservaNoJestor(taxaReserva: typeTaxaReserva) {
 
    try {
        // nome do campo no Jestor | nome do campo no banco de dados local
        const data: any = {
            idbdapi: taxaReserva.id, // ID do banco da API EngNet
            reservaid: taxaReserva.reservaId,
            nometaxa: taxaReserva.name,
            valor: taxaReserva.valor,
        };

        // Envia os dados pro Jestor
        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_TAXARESERVA, // ID da tabela no Jestor
            data,
        });
        /* para depuracao
        console.log("--------------------------------------------------");
        console.log('taxaReserva inserido no Jestor:\n\n', response.data);
        console.log("--------------------------------------------------");
        */
        return response.data; // Retorna o dado inserido

    } catch (error: any) {
        console.error('Erro ao inserir taxaReserva no Jestor:', error.response?.data || error.message);
        throw new Error('Erro ao inserir taxaReserva no Jestor');
    }
}

/**
 * Sincroniza os taxasReservas não sincronizados do banco local com o Jestor.
 */
export async function sincronizarTaxaReserva() {
    try {
        const taxasReservasNaoSincronizados = await getTaxasReservasNaoSincronizados();

        if(taxasReservasNaoSincronizados){
            for (const taxaReserva of taxasReservasNaoSincronizados) {
                const existeNoJestor = await verificarTaxaReservaNoJestor(taxaReserva.id, taxaReserva.name);
       
                if (!existeNoJestor) {
                    await inserirTaxaReservaNoJestor(taxaReserva);
                    console.log("--------------------------------------------------");    
                    console.log(`TaxaReserva: ${taxaReserva.id} ${taxaReserva.name}\nSincronizado com sucesso!`);

                } else {
                    console.log("--------------------------------------------------");
                    console.log(`TaxaReserva: ${taxaReserva.id} ${taxaReserva.name}\nJa existe no Jestor. Atualizado no banco local.`);

                }
                // Atualiza o status no banco local para sincronizado
                await atualizaCampoSincronizadoNoJestor('taxaReserva', taxaReserva.id, taxaReserva.name);
            }
        }
    } catch (error: any) {
        console.error('Erro ao sincronizar taxaReserva:', error.message);
    }
}

/* funcao de teste
(async () => {
  await sincronizarTaxaReserva();
})();
*/