// Canal

import jestorClient from '../../../config/jestorClient';
import { typeCanal } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor, getCanaisNaoSincronizados } from '../../database/models';
import { registrarErroJestor } from '../../database/erro.service';
import prisma from '../../../config/database';
import { logDebug } from '../../../utils/logger';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_CANAL = 'd062e04caa41e8cce1c73';

/**
 * Consulta o Jestor para verificar se o canal existe e, se sim, retorna o ID interno.
 * @param idExterno - O ID externo do canal.
 * @returns - O ID interno do Jestor ou null se o canal não existir.
 */
export async function obterIdInternoCanalNoJestor(idExterno: string) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_CANAL,
            filters: [{ field: 'codigo', value: idExterno, operator: '==' }],
        });

        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            return items[0][`id_${JESTOR_TB_CANAL}`] ?? null;
        }

        return null;

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao buscar canal no Jestor: ${errorMessage}`);
        throw new Error('Erro ao buscar canal no Jestor');
    }
}

/**
 * Insere um canal no Jestor.
 * @param canal - Dados do canal a serem inseridos.
 */
export async function inserirCanalNoJestor(canal: typeCanal) {
    try {
        const data: Record<string, any> = {
            id_bd_engnet: canal.id,
            codigo: canal.idExterno,
            name: canal.titulo,
        };

        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_CANAL,
            data,
        });

        logDebug('Canal', `✅ Canal ${canal.idExterno} inserido com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao inserir canal ${canal.idExterno} no Jestor: ${errorMessage}`);
        throw new Error(`Erro ao inserir canal ${canal.idExterno} no Jestor`);
    }
}

/**
 * Atualiza um canal existente no Jestor.
 * @param canal - Dados do canal a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarCanalNoJestor(canal: typeCanal, idInterno: string) {
    try {
        const data: Record<string, any> = {
            object_type: JESTOR_TB_CANAL,
            data: {
                [`id_${JESTOR_TB_CANAL}`]: idInterno,
                name: canal.titulo,
            }
        };

        const response = await jestorClient.post(ENDPOINT_UPDATE, data);

        logDebug('Canal', `🔹 Canal ${canal.idExterno} atualizado com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao atualizar canal ${canal.idExterno} no Jestor: ${errorMessage}`);
        throw new Error(`Erro ao atualizar canal ${canal.idExterno} no Jestor`);
    }
}

/**
 * Sincroniza apenas UM canal específico com o Jestor.
 */
export async function sincronizarCanal(canal: typeCanal): Promise<number | null> {
    try {

        // 🔍 Usa o jestorId do canal (caso já tenha) para evitar nova consulta
        let idInterno: number | null = canal.jestorId || null;

        // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
        if (!idInterno) {
        idInterno = await obterIdInternoCanalNoJestor(canal.idExterno);
        }

        if (!idInterno) {
            const response = await inserirCanalNoJestor(canal);
            idInterno = response?.data?.[`id_${JESTOR_TB_CANAL}`];
        } else {
            await atualizarCanalNoJestor(canal, idInterno.toString());
        }

        return idInterno;

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';

        logDebug('Erro', `❌ Erro ao sincronizar canal ${canal.idExterno}: ${errorMessage}`);

        await prisma.canal.update({
            where: { idExterno: canal.idExterno },
            data: { sincronizadoNoJestor: false },
        });

        throw new Error(`Erro ao sincronizar canal ${canal.idExterno}`);
    }
}
