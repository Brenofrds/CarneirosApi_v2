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
export async function obterIdErroNoJestor(idApi: number) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_ERRO_STAYS,
            filters: [{ field: 'idApi', value: idApi, operator: '==' }],
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
 * Insere um erro de sincronização no Jestor.
 * 
 * @param erro - Dados do erro a serem inseridos.
 */
export async function inserirErroNoJestor(erro: any) {
    try {
        const data = {
            idApi: erro.id,
            nometabelanaapi: erro.tabela,
            idregistronaapi: erro.registroId,
            erro: erro.erro,
            tentativas: erro.tentativas,
            dataerro: erro.data,
            errohora: erro.hora,
        };

        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_ERRO_STAYS,
            data,
        });

        logDebug('ErroJestor', `✅ Erro ${erro.id} inserido com sucesso no Jestor!`);
        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        
        logDebug('Erro', `❌ Erro ao inserir erro ${erro.id} no Jestor: ${errorMessage}`);
        
        // Salvar erro localmente SEM tentar reenviar automaticamente
        await prisma.erroSincronizacaoJestor.update({
            where: { id: erro.id },
            data: { sincronizadoNoJestor: false },
        });

        throw new Error(`Erro ao inserir erro ${erro.id} no Jestor`);
    }
}

/**
 * Atualiza um erro de sincronização no Jestor.
 * 
 * @param erro - Dados do erro a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarErroNoJestor(erro: any, idInterno: string) {
    try {
        const data = {
            object_type: JESTOR_TB_ERRO_STAYS,
            data: {
                [`id_${JESTOR_TB_ERRO_STAYS}`]: idInterno,
                idApi: erro.id,
                nometabelanaapi: erro.tabela,
                idregistronaapi: erro.registroId,
                erro: erro.erro,
                tentativas: erro.tentativas,
                dataerro: erro.data,
                errohora: erro.hora,
            },
        };

        const response = await jestorClient.post(ENDPOINT_UPDATE, data);
        logDebug('ErroJestor', `🔹 Erro ${erro.id} atualizado com sucesso no Jestor!`);
        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        
        logDebug('Erro', `❌ Erro ao atualizar erro ${erro.id} no Jestor: ${errorMessage}`);
        
        // Salvar erro localmente SEM tentar reenviá-lo automaticamente
        await prisma.erroSincronizacaoJestor.update({
            where: { id: erro.id },
            data: { sincronizadoNoJestor: false },
        });

        throw new Error(`Erro ao atualizar erro ${erro.id} no Jestor`);
    }
}

/**
 * Sincroniza um erro de sincronização específico com o Jestor.
 * 
 * @param erro - Dados do erro a ser sincronizado.
 */
export async function sincronizarErroJestor(erro: any) {
    try {
        // 📥 Obtém o ID interno do erro no Jestor
        const idInterno = await obterIdErroNoJestor(erro.id);

        if (!idInterno) {
            await inserirErroNoJestor(erro);
        } else {
            await atualizarErroNoJestor(erro, idInterno);
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

