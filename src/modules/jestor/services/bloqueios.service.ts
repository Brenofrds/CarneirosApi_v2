import jestorClient from '../../../config/jestorClient';
import { typeBloqueio } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor, getBloqueiosNaoSincronizados } from '../../database/models';
import { registrarErroJestor } from '../../database/erro.service';
import prisma from '../../../config/database';
import { logDebug } from '../../../utils/logger';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_BLOQUEIO = 'e0bldzqfovxjs42u67wqk';

/**
 * Consulta o Jestor para verificar se o bloqueio existe e, se sim, retorna o ID interno.
 * @param idExterno - O ID externo do bloqueio.
 * @returns - O ID interno do Jestor ou null se o bloqueio não existir.
 */
export async function obterIdInternoBloqueioNoJestor(idExterno: string) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_BLOQUEIO,
            filters: [{ field: 'idexterno_1', value: idExterno, operator: '==' }],
        });

        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            return items[0][`id_${JESTOR_TB_BLOQUEIO}`] ?? null;
        }

        return null;

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao buscar bloqueio no Jestor: ${errorMessage}`);
        throw new Error('Erro ao buscar bloqueio no Jestor');
    }
}

/**
 * Insere um bloqueio no Jestor.
 * @param bloqueio - Dados do bloqueio a serem inseridos.
 */
export async function inserirBloqueioNoJestor(bloqueio: typeBloqueio, imovelIdJestor?: number) {
    try {
        const data: Record<string, any> = {
            idapi: bloqueio.id,
            idexterno_1: bloqueio.idExterno,
            localizador: bloqueio.localizador,
            checkin_1: bloqueio.checkIn,
            checkout_1: bloqueio.checkOut,
            horacheckin: bloqueio.horaCheckIn,
            horacheckout: bloqueio.horaCheckOut,
            notainterna: bloqueio.notaInterna,
            imovelid: bloqueio.imovelId,
            imovel: bloqueio.imovelId,
            imovel_1: imovelIdJestor,
        };

        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_BLOQUEIO,
            data,
        });

        logDebug('Bloqueio', `✅ Bloqueio ${bloqueio.idExterno} inserido com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao inserir bloqueio ${bloqueio.idExterno} no Jestor: ${errorMessage}`);
        await registrarErroJestor('bloqueio', bloqueio.idExterno, errorMessage);
        throw new Error(`Erro ao inserir bloqueio ${bloqueio.idExterno} no Jestor`);
    }
}

/**
 * Atualiza um bloqueio existente no Jestor.
 * @param bloqueio - Dados do bloqueio a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarBloqueioNoJestor(bloqueio: typeBloqueio, idInterno: string, imovelIdJestor?: number) {
    try {
        logDebug('Bloqueio', `🔍 imovelIdJestor recebido para bloqueio ${bloqueio.idExterno}: ${imovelIdJestor}`);

        const data: Record<string, any> = {
            object_type: JESTOR_TB_BLOQUEIO,
            data: {
                [`id_${JESTOR_TB_BLOQUEIO}`]: idInterno, // ID interno obrigatório
                idapi: bloqueio.id,
                idexterno_1: bloqueio.idExterno,
                localizador: bloqueio.localizador,
                checkin_1: bloqueio.checkIn,
                checkout_1: bloqueio.checkOut,
                horacheckin: bloqueio.horaCheckIn,
                horacheckout: bloqueio.horaCheckOut,
                notainterna: bloqueio.notaInterna,
                imovelid: bloqueio.imovelId,
                imovel: bloqueio.imovelId,
                imovel_1: imovelIdJestor,
            },
        };

        const response = await jestorClient.post(ENDPOINT_UPDATE, data);

        logDebug('Bloqueio', `🔹 Bloqueio ${bloqueio.idExterno} atualizado com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';

        logDebug('Erro', `❌ Erro ao atualizar bloqueio ${bloqueio.idExterno} no Jestor: ${errorMessage}`);

        await registrarErroJestor('bloqueio', bloqueio.idExterno, errorMessage);

        throw new Error(`Erro ao atualizar bloqueio ${bloqueio.idExterno} no Jestor`);
    }
}

/**
 * Sincroniza apenas UM bloqueio específico com o Jestor.
 */
export async function sincronizarBloqueio(bloqueio: typeBloqueio, imovelIdJestor?: number) {
    try {
        const idInterno = await obterIdInternoBloqueioNoJestor(bloqueio.idExterno);

        if (!idInterno) {
            await inserirBloqueioNoJestor(bloqueio, imovelIdJestor);
        } else {
            await atualizarBloqueioNoJestor(bloqueio, idInterno, imovelIdJestor);
        }

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';

        logDebug('Erro', `❌ Erro ao sincronizar bloqueio ${bloqueio.idExterno}: ${errorMessage}`);

        await prisma.bloqueio.update({
            where: { idExterno: bloqueio.idExterno },
            data: { sincronizadoNoJestor: false },
        });

        throw new Error(`Erro ao sincronizar bloqueio ${bloqueio.idExterno}`);
    }
}
