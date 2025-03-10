import jestorClient from '../../../config/jestorClient';
import { typeProprietario } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor } from '../../database/models';
import { registrarErroJestor } from '../../database/erro.service';
import prisma from '../../../config/database';
import { logDebug } from '../../../utils/logger';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_PROPRIETARIO = 'yhe66m7287os9_0xq_kbu';

/**
 * Consulta o Jestor para verificar se o proprietário existe e, se sim, retorna o ID interno.
 * 
 * @param nome - Nome do proprietário.
 * @param telefone - Telefone do proprietário.
 * @returns - O ID interno do Jestor ou null se o proprietário não existir.
 */
export async function obterIdInternoProprietarioNoJestor(nome: string, telefone: string | null) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_PROPRIETARIO,
            filters: [
                { field: 'nome_1', value: nome, operator: '==' },
                { field: 'telefone', value: telefone, operator: '==' },
            ],
        });

        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            const idInterno = items[0][`id_${JESTOR_TB_PROPRIETARIO}`];
            return idInterno ?? null;
        }

        return null;

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao buscar proprietário no Jestor: ${errorMessage}`);
        throw new Error('Erro ao buscar proprietário no Jestor');
    }
}

/**
 * Insere um proprietário no Jestor.
 * @param proprietario - Dados do proprietário a serem inseridos.
 */
export async function inserirProprietarioNoJestor(proprietario: typeProprietario) {
    try {
        const data: Record<string, any> = {
            idapi: proprietario.id,
            nome_1: proprietario.nome,
            telefone: proprietario.telefone,
        };

        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_PROPRIETARIO,
            data,
        });

        logDebug('Proprietário', `🔹 Proprietário ${proprietario.nome} inserido com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao inserir proprietário ${proprietario.nome} no Jestor: ${errorMessage}`);
        
        await registrarErroJestor('proprietario', proprietario.id.toString(), errorMessage);
        
        throw new Error(`Erro ao inserir proprietário ${proprietario.nome} no Jestor`);
    }
}

/**
 * Atualiza um proprietário existente no Jestor.
 * @param proprietario - Dados do proprietário a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarProprietarioNoJestor(proprietario: typeProprietario, idInterno: string) {
    try {
        const data: Record<string, any> = {
            object_type: JESTOR_TB_PROPRIETARIO,
            data: {
                [`id_${JESTOR_TB_PROPRIETARIO}`]: idInterno,
                nome_1: proprietario.nome,
                telefone: proprietario.telefone,
            }
        };

        const response = await jestorClient.post(ENDPOINT_UPDATE, data);

        if (response.data?.status) {
            logDebug('Proprietário', `🔹 Proprietário ${proprietario.nome} atualizado com sucesso no Jestor!`);
        } else {
            logDebug('Proprietário', `⚠️ Atualização do proprietário ${proprietario.nome} no Jestor retornou um status inesperado.`);
        }

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        
        logDebug('Erro', `❌ Erro ao atualizar proprietário ${proprietario.nome} no Jestor: ${errorMessage}`);
        
        await registrarErroJestor("proprietario", proprietario.id.toString(), errorMessage);
        
        throw new Error(`Erro ao atualizar proprietário ${proprietario.nome} no Jestor`);
    }
}

/**
 * Sincroniza apenas UM proprietário específico com o Jestor.
 */
export async function sincronizarProprietario(proprietario: typeProprietario) {
    try {
        const idInterno = await obterIdInternoProprietarioNoJestor(proprietario.nome, proprietario.telefone);

        if (!idInterno) {
            await inserirProprietarioNoJestor(proprietario);
        } else {
            await atualizarProprietarioNoJestor(proprietario, idInterno);
        }

        await atualizaCampoSincronizadoNoJestor('proprietario', proprietario.id);

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';

        logDebug('Erro', `❌ Erro ao sincronizar proprietário ${proprietario.nome}: ${errorMessage}`);
        
        await prisma.proprietario.update({
            where: { id: proprietario.id },
            data: { sincronizadoNoJestor: false },
        });

        throw new Error(`Erro ao sincronizar proprietário ${proprietario.nome}`);
    }
}
