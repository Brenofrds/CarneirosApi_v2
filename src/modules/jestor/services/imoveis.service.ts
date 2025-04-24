import jestorClient from '../../../config/jestorClient';
import { typeImovel } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor, getImoveisNaoSincronizados } from '../../database/models';
import { registrarErroJestor } from '../../database/erro.service';
import { logDebug } from '../../../utils/logger';
import prisma from '../../../config/database';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_IMOVEL = 'oplicg48civ1tjt96g6e7';

/**
 * Consulta o Jestor para verificar se o imóvel existe e, se sim, retorna o ID interno.
 * 
 * @param idExterno - O ID externo do imóvel.
 * @param sku - O SKU do imóvel.
 * @returns - O ID interno do Jestor ou null se o imóvel não existir.
 */
export async function obterIdInternoImovelNoJestor(idExterno: string, sku: string | null) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_IMOVEL,
            filters: [
                { field: 'idexterno', value: idExterno, operator: '==' },
                { field: 'sku', value: sku, operator: '==' },
            ],
        });

        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            const idInterno = items[0][`id_${JESTOR_TB_IMOVEL}`];
            return idInterno ?? null;
        }

        return null;

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao buscar imóvel no Jestor: ${errorMessage}`);
        throw new Error('Erro ao buscar imóvel no Jestor');
    }
}

/**
 * Insere um imóvel no Jestor.
 * @param imovel - Dados do imóvel a serem inseridos.
 */
export async function inserirImovelNoJestor(imovel: typeImovel, condominioIdJestor?: number, proprietarioIdJestor?: number) {
    try {
        const data: Record<string, any> = {
            idbdengnet: imovel.id,
            idexterno: imovel.idExterno,
            idstays: imovel.idStays,
            sku: imovel.sku,
            status_2: imovel.status,
            idcondominiostays: imovel.idCondominioStays || null,
            regiao: imovel.regiao || null,
            proprietario_id: imovel.proprietarioId || null, // ✅ Agora enviamos também o ID do proprietário
            condominio: condominioIdJestor || null, 
            proprietario: proprietarioIdJestor || null,
        };

        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_IMOVEL,
            data,
        });

        logDebug('Imóvel', `✅ Imóvel ${imovel.idExterno} inserido com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao inserir imóvel ${imovel.idExterno} no Jestor: ${errorMessage}`);        
        throw new Error(`Erro ao inserir imóvel ${imovel.idExterno} no Jestor`);
    }
}

/**
 * Atualiza um imóvel existente no Jestor.
 * @param imovel - Dados do imóvel a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarImovelNoJestor(imovel: typeImovel, idInterno: string, condominioIdJestor?: number, proprietarioIdJestor?: number) {
    try {
        const data: Record<string, any> = {
            object_type: JESTOR_TB_IMOVEL,
            data: {
                [`id_${JESTOR_TB_IMOVEL}`]: idInterno, // ✅ Campo obrigatório do ID interno
                idexterno: imovel.idExterno,
                idstays: imovel.idStays,
                sku: imovel.sku,
                status_2: imovel.status,
                idcondominiostays: imovel.idCondominioStays || null,
                regiao: imovel.regiao || null,
                proprietario_id: imovel.proprietarioId || null,
                condominio: condominioIdJestor || null, 
                proprietario: proprietarioIdJestor || null,
            }
        };

        // 🚀 Envia a solicitação de atualização ao Jestor
        const response = await jestorClient.post(ENDPOINT_UPDATE, data);

        // ✅ Log simplificado apenas com o status e o ID do imóvel atualizado
        if (response.data?.status) {
            logDebug('Imóvel', `🔹 Imóvel ${imovel.idExterno} atualizado com sucesso no Jestor!`);
        } else {
            logDebug('Imóvel', `⚠️ Atualização do imóvel ${imovel.idExterno} no Jestor retornou um status inesperado.`);
        }

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        
        logDebug('Erro', `❌ Erro ao atualizar imóvel ${imovel.idExterno} no Jestor: ${errorMessage}`);
        
        throw new Error(`Erro ao atualizar imóvel ${imovel.idExterno} no Jestor`);
    }
}

/**
 * Sincroniza apenas UM imóvel específico com o Jestor.
 */
export async function sincronizarImovel(imovel: typeImovel, condominioIdJestor?: number, proprietarioIdJestor?: number): Promise<number | null> {
    try {

        // 🔍 Usa o jestorId do canal (caso já tenha) para evitar nova consulta
        let idInterno: number | null = imovel.jestorId || null;

        // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
        if (!idInterno) {
            idInterno = await obterIdInternoImovelNoJestor(imovel.idExterno, imovel.sku);
        }

        if (!idInterno) {
            const response = await inserirImovelNoJestor(imovel, condominioIdJestor, proprietarioIdJestor);
            idInterno = response?.data?.[`id_${JESTOR_TB_IMOVEL}`];
        } else {
            await atualizarImovelNoJestor(imovel, idInterno.toString(), condominioIdJestor, proprietarioIdJestor);
        }

        return idInterno;

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';

        logDebug('Erro', `❌ Erro ao sincronizar imóvel ${imovel.idExterno}: ${errorMessage}`);
        
        // ⚠️ Define o campo `sincronizadoNoJestor` como `false` para futuras tentativas
        await prisma.imovel.update({
            where: { idExterno: imovel.idExterno },
            data: { sincronizadoNoJestor: false },
        });

        // Lança o erro novamente para tratamento adicional
        throw new Error(`Erro ao sincronizar imóvel ${imovel.idExterno}`);
    }
}
