import jestorClient from '../../../config/jestorClient';
import prisma from '../../../config/database';
import { logDebug } from '../../../utils/logger';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_ERRO_STAYS = 'org2zt5na9n4bymuqqn6k';

/**
 * Obtém o ID interno do erro no Jestor
 * 
 * @param idApi - O ID interno do erro no banco de dados.
 * @returns - O ID interno do Jestor ou null se não existir.
 */
export async function obterIdErroStaysNoJestor(idApi: number) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_ERRO_STAYS,
            filters: [{ field: 'idapi', value: idApi, operator: '==' }],
        });

        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            return items[0][`id_${JESTOR_TB_ERRO_STAYS}`] ?? null;
        }
        return null;

    } catch (error: any) {
        logDebug('Erro', `❌ Erro ao buscar erro no Jestor: ${error.message}`);
        throw new Error('Erro ao buscar erro no Jestor');
    }
}

/**
 * Insere um erro de sincronização da Stays no Jestor.
 * 
 * @param erro - Dados do erro a serem inseridos.
 */
export async function inserirErroStaysNoJestor(erro: any) {
    try {
        const data = {
            idapi: erro.id,
            acao: erro.acao,
            payloadid: erro.payloadId,
            payloadjson: erro.payloadJson ? JSON.stringify(erro.payloadJson) : null,
            errotexto: erro.erro,
            tentativas: erro.tentativas,
            errodata: erro.data,
            errohora: erro.hora,
        };

        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_ERRO_STAYS,
            data,
        });

        logDebug('ErroStays', `✅ Erro ${erro.id} inserido com sucesso no Jestor!`);
        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        
        logDebug('Erro', `❌ Erro ao inserir erro ${erro.id} no Jestor: ${errorMessage}`);
        
        // Salvar erro localmente SEM tentar reenviar automaticamente
        await prisma.erroSincronizacaoStays.update({
            where: { id: erro.id },
            data: { sincronizadoNoJestor: false },
        });

        throw new Error(`Erro ao inserir erro ${erro.id} no Jestor`);
    }
}

/**
 * Atualiza um erro de sincronização da Stays no Jestor.
 * 
 * @param erro - Dados do erro a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarErroStaysNoJestor(erro: any, idInterno: string) {
    try {
        const data = {
            object_type: JESTOR_TB_ERRO_STAYS,
            data: {
                [`id_${JESTOR_TB_ERRO_STAYS}`]: idInterno,
                idapi: erro.id,
                acao: erro.acao,
                payloadid: erro.payloadId,
                payloadjson: erro.payloadJson ? JSON.stringify(erro.payloadJson) : null,
                errotexto: erro.erro,
                tentativas: erro.tentativas,
                errodata: erro.data,
                errohora: erro.hora,
            },
        };

        const response = await jestorClient.post(ENDPOINT_UPDATE, data);
        logDebug('ErroStays', `🔹 Erro ${erro.id} atualizado com sucesso no Jestor!`);
        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        
        logDebug('Erro', `❌ Erro ao atualizar erro ${erro.id} no Jestor: ${errorMessage}`);
        
        // Salvar erro localmente SEM tentar reenviá-lo automaticamente
        await prisma.erroSincronizacaoStays.update({
            where: { id: erro.id },
            data: { sincronizadoNoJestor: false },
        });

        throw new Error(`Erro ao atualizar erro ${erro.id} no Jestor`);
    }
}

/**
 * Sincroniza um erro de sincronização da Stays específico com o Jestor.
 * 
 * @param erro - Dados do erro a ser sincronizado.
 */
export async function sincronizarErroStays(erro: any) {
    try {
        // 📥 Obtém o ID interno do erro no Jestor
        const idInterno = await obterIdErroStaysNoJestor(erro.id);

        if (!idInterno) {
            await inserirErroStaysNoJestor(erro);
        } else {
            await atualizarErroStaysNoJestor(erro, idInterno);
        }

        // ✅ Atualiza o status de sincronização no banco de dados
        await prisma.erroSincronizacaoStays.update({
            where: { id: erro.id },
            data: { sincronizadoNoJestor: true },
        });

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao sincronizar erro ${erro.id}: ${errorMessage}`);
        
        // ⚠️ Define o campo `sincronizadoNoJestor` como `false` para futuras tentativas
        await prisma.erroSincronizacaoStays.update({
            where: { id: erro.id },
            data: { sincronizadoNoJestor: false },
        });

        throw new Error(`Erro ao sincronizar erro ${erro.id}`);
    }
}
