import jestorClient from '../../../config/jestorClient';
import { typeHospede } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor } from '../../database/models';
import { registrarErroJestor } from '../../database/erro.service';
import { logDebug } from '../../../utils/logger';
import prisma from '../../../config/database';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_HOSPEDE = 'b_d6pu1giq_jb0gd7f0ed';

/**
 * Consulta o Jestor para verificar se o hóspede existe e, se sim, retorna o ID interno.
 * 
 * @param nome - Nome completo do hóspede.
 * @param idExterno - O ID externo do hóspede.
 * @param reservaId - O ID da reserva associada.
 * @returns - O ID interno do Jestor ou null se o hóspede não existir.
 */
export async function obterIdInternoHospedeNoJestor(nome: string, idExterno: string | null, reservaId: number) {
    try {
        const filters: any[] = [
            { field: 'nomecompleto', value: nome, operator: '==' },
            { field: 'id_reserva', value: reservaId, operator: '==' }
        ];

        if (idExterno) { 
            filters.push({ field: 'idexterno', value: idExterno, operator: '==' });
        }

        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_HOSPEDE,
            filters,
        });

        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            const idInterno = items[0][`id_${JESTOR_TB_HOSPEDE}`];
            return idInterno ?? null;
        }

        return null;

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao buscar hóspede no Jestor: ${errorMessage}`);
        throw new Error('Erro ao buscar hóspede no Jestor');
    }
}

/**
 * Insere um hóspede no Jestor.
 * @param hospede - Dados do hóspede a serem inseridos.
 */
export async function inserirHospedeNoJestor(hospede: typeHospede) {
    try {
        const data: Record<string, any> = {
            name: hospede.id,
            idexterno: hospede.idExterno,
            nomecompleto: hospede.nomeCompleto,
            email: hospede.email,
            datanascimento: hospede.dataDeNascimento,
            telefone: hospede.telefone,
            cpf: hospede.cpf,
            documento: hospede.documento,
            id_reserva: hospede.reservaId,
        };

        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_HOSPEDE,
            data,
        });

        logDebug('Hóspede', `✅ Hóspede ${hospede.nomeCompleto} inserido com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao inserir hóspede ${hospede.nomeCompleto} no Jestor: ${errorMessage}`);
        
        // 🔥 Registra o erro na tabela de sincronização
        await registrarErroJestor('hospede', hospede.idExterno || '', errorMessage);
        
        throw new Error(`Erro ao inserir hóspede ${hospede.nomeCompleto} no Jestor`);
    }
}

/**
 * Atualiza um hóspede existente no Jestor.
 * @param hospede - Dados do hóspede a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarHospedeNoJestor(hospede: typeHospede, idInterno: string) {
    try {
        const data: Record<string, any> = {
            object_type: JESTOR_TB_HOSPEDE,
            data: {
                [`id_${JESTOR_TB_HOSPEDE}`]: idInterno, // Campo obrigatório do ID interno
                nomecompleto: hospede.nomeCompleto,
                email: hospede.email,
                datanascimento: hospede.dataDeNascimento,
                telefone: hospede.telefone,
                cpf: hospede.cpf,
                documento: hospede.documento,
                id_reserva: hospede.reservaId,
            }
        };

        // 🚀 Envia a solicitação de atualização ao Jestor
        const response = await jestorClient.post(ENDPOINT_UPDATE, data);

        // ✅ Log simplificado apenas com o status e o nome do hóspede atualizado
        if (response.data?.status) {
            logDebug('Hóspede', `🔹 Hóspede ${hospede.nomeCompleto} atualizado com sucesso no Jestor!`);
        } else {
            logDebug('Hóspede', `⚠️ Atualização do hóspede ${hospede.nomeCompleto} no Jestor retornou um status inesperado.`);
        }

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        
        logDebug('Erro', `❌ Erro ao atualizar hóspede ${hospede.nomeCompleto} no Jestor: ${errorMessage}`);

        // 🔥 Registra erro na tabela ErroSincronizacao
        await registrarErroJestor("hospede", hospede.idExterno || '', errorMessage);
        
        throw new Error(`Erro ao atualizar hóspede ${hospede.nomeCompleto} no Jestor`);
    }
}

/**
 * Sincroniza apenas UM hóspede específico com o Jestor.
 */
export async function sincronizarHospede(hospede: typeHospede) {
    try {
        // 📥 Tenta obter o ID interno do hóspede no Jestor
        const idInterno = await obterIdInternoHospedeNoJestor(hospede.nomeCompleto, hospede.idExterno, hospede.reservaId);

        if (!idInterno) {
            await inserirHospedeNoJestor(hospede);
        } else {
            await atualizarHospedeNoJestor(hospede, idInterno);
        }

        // ✅ Marca como sincronizado apenas se não houver erro
        await atualizaCampoSincronizadoNoJestor('hospede', hospede.idExterno || '');

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';

        logDebug('Erro', `❌ Erro ao sincronizar hóspede ${hospede.nomeCompleto}: ${errorMessage}`);
        
        // ⚠️ Define o campo `sincronizadoNoJestor` como `false` para futuras tentativas
        await prisma.hospede.update({
            where: { idExterno: hospede.idExterno || '' },
            data: { sincronizadoNoJestor: false },
        });

        // Lança o erro novamente para tratamento adicional
        throw new Error(`Erro ao sincronizar hóspede ${hospede.nomeCompleto}`);
    }
}
