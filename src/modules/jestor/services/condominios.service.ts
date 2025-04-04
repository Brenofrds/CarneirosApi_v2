import jestorClient from '../../../config/jestorClient';
import { typeCondominio } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor } from '../../database/models';
import { registrarErroJestor } from '../../database/erro.service';
import { logDebug } from '../../../utils/logger';
import prisma from '../../../config/database';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_CONDOMINIO = 'w_zk_k73oj_eld8yvjn0u';

/**
 * Consulta o Jestor para verificar se o condomínio existe e, se sim, retorna o ID interno.
 * 
 * @param idExterno - O ID externo do condomínio.
 * @param sku - O SKU do condomínio.
 * @returns - O ID interno do Jestor ou null se o condomínio não existir.
 */
export async function obterIdInternoCondominioNoJestor(idExterno: string, sku: string | null) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_CONDOMINIO,
            filters: [
                { field: 'idexterno', value: idExterno, operator: '==' },
                { field: 'skuinternalname', value: sku, operator: '==' },
            ],
        });

        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            const idInterno = items[0][`id_${JESTOR_TB_CONDOMINIO}`];
            return idInterno ?? null;
        }

        return null;

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao buscar condomínio no Jestor: ${errorMessage}`);
        throw new Error('Erro ao buscar condomínio no Jestor');
    }
}

/**
 * Insere um condomínio no Jestor.
 * @param condominio - Dados do condomínio a serem inseridos.
 */
export async function inserirCondominioNoJestor(condominio: typeCondominio) {
    try {
        const data: Record<string, any> = {
            idbdengnet: condominio.id,
            idexterno: condominio.idExterno,
            idstays: condominio.idStays,
            skuinternalname: condominio.sku,
            regiao: condominio.regiao,
            status_1: condominio.status, 
        };

        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_CONDOMINIO,
            data,
        });

        logDebug('Condomínio', `✅ Condomínio ${condominio.idExterno} inserido com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao inserir condomínio ${condominio.idExterno} no Jestor: ${errorMessage}`);
        
        // 🔥 Registra o erro na tabela de sincronização
        await registrarErroJestor('condominio', condominio.idExterno, errorMessage);
        
        throw new Error(`Erro ao inserir condomínio ${condominio.idExterno} no Jestor`);
    }
}

/**
 * Atualiza um condomínio existente no Jestor.
 * @param condominio - Dados do condomínio a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarCondominioNoJestor(condominio: typeCondominio, idInterno: string) {
    try {
        const data: Record<string, any> = {
            object_type: JESTOR_TB_CONDOMINIO,
            data: {
                [`id_${JESTOR_TB_CONDOMINIO}`]: idInterno,
                idexterno: condominio.idExterno,
                idstays: condominio.idStays,
                skuinternalname: condominio.sku,
                regiao: condominio.regiao,
                status_1: condominio.status,
            }
        };

        const response = await jestorClient.post(ENDPOINT_UPDATE, data);

        if (response.data?.status) {
            logDebug('Condomínio', `🔹 Condomínio ${condominio.idExterno} atualizado com sucesso no Jestor!`);
        } else {
            logDebug('Condomínio', `⚠️ Atualização do condomínio ${condominio.idExterno} no Jestor retornou um status inesperado.`);
        }

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';

        logDebug('Erro', `❌ Erro ao atualizar condomínio ${condominio.idExterno} no Jestor: ${errorMessage}`);
        
        await registrarErroJestor("condominio", condominio.idExterno, errorMessage);
        
        throw new Error(`Erro ao atualizar condomínio ${condominio.idExterno} no Jestor`);
    }
}

/**
 * Sincroniza apenas UM condomínio específico com o Jestor.
 */
export async function sincronizarCondominio(condominio: typeCondominio): Promise<number | null> {
    try {

        let idInterno: number | null = condominio.jestorId || null;

        // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
        if (!idInterno) {
            idInterno = await obterIdInternoCondominioNoJestor(condominio.idExterno, condominio.sku);
        }

        // 🚀 Decide entre inserir ou atualizar
        if (!idInterno) {
            const response = await inserirCondominioNoJestor(condominio);
            idInterno = response?.data?.[`id_${JESTOR_TB_CONDOMINIO}`];
        } else {
            await atualizarCondominioNoJestor(condominio, idInterno.toString());
        }

        await atualizaCampoSincronizadoNoJestor('condominio', condominio.idExterno);

        return idInterno;

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';

        logDebug('Erro', `❌ Erro ao sincronizar condomínio ${condominio.idExterno}: ${errorMessage}`);
        
        await prisma.condominio.update({
            where: { idExterno: condominio.idExterno },
            data: { sincronizadoNoJestor: false },
        });

        throw new Error(`Erro ao sincronizar condomínio ${condominio.idExterno}`);
    }
}
