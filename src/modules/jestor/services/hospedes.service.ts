import jestorClient from '../../../config/jestorClient';
import { typeHospede } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor } from '../../database/models';
import { registrarErroJestor } from '../../database/erro.service';
import { logDebug } from '../../../utils/logger';
import prisma from '../../../config/database';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_HOSPEDE = '9ojuwm9mwun5ik__gkp21';

/**
 * Consulta o Jestor para verificar se o hóspede existe e, se sim, retorna o ID interno.
 * Tenta primeiro buscar por idExterno; se não encontrar, busca pelo nome.
 * 
 * @param nome - Nome completo do hóspede.
 * @param idExterno - O ID externo do hóspede.
 * @returns - O ID interno do Jestor ou null se o hóspede não existir.
 */
export async function obterIdInternoHospedeNoJestor(nome: string, idExterno: string | null): Promise<string | null> {
    try {
        // 1. Buscar pelo idExterno, se fornecido
        if (idExterno) {
            const responseId = await jestorClient.post(ENDPOINT_LIST, {
                object_type: JESTOR_TB_HOSPEDE,
                filters: [{ field: 'idexterno', value: idExterno, operator: '==' }],
            });

            const itemsId = responseId.data?.data?.items;
            if (Array.isArray(itemsId) && itemsId.length > 0) {
                const idInterno = itemsId[0][`id_${JESTOR_TB_HOSPEDE}`];
                return idInterno ?? null;
            }
        }

        // 2. Se não encontrou pelo idExterno, buscar pelo nome
        const responseNome = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_HOSPEDE,
            filters: [{ field: 'name', value: nome, operator: '==' }],
        });

        const itemsNome = responseNome.data?.data?.items;
        if (Array.isArray(itemsNome) && itemsNome.length > 0) {
            const idInterno = itemsNome[0][`id_${JESTOR_TB_HOSPEDE}`];
            return idInterno ?? null;
        }

        // 3. Não encontrou nenhum resultado
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
export async function inserirHospedeNoJestor(hospede: typeHospede, reservaIdJestor?: number) {
    try {
        const data: Record<string, any> = {
            id_bd_engnet: hospede.id,
            idexterno: hospede.idExterno,
            name: hospede.nomeCompleto,
            email: hospede.email,
            data_de_nascimento: hospede.dataDeNascimento,
            idade: hospede.idade,
            telefone: hospede.telefone,
            cpf: hospede.cpf,
            documento: hospede.documento,
            idreserva: hospede.reservaId,
            reserva: reservaIdJestor,
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
        throw new Error(`Erro ao inserir hóspede ${hospede.nomeCompleto} no Jestor`);
    }
}

/**
 * Atualiza um hóspede existente no Jestor.
 * @param hospede - Dados do hóspede a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarHospedeNoJestor(hospede: typeHospede, idInterno: string, reservaIdJestor?: number) {
    try {
        const data: Record<string, any> = {
            object_type: JESTOR_TB_HOSPEDE,
            data: {
                [`id_${JESTOR_TB_HOSPEDE}`]: idInterno,
                id_bd_engnet: hospede.id,
                idexterno: hospede.idExterno,
                name: hospede.nomeCompleto,
                email: hospede.email,
                data_de_nascimento: hospede.dataDeNascimento,
                idade: hospede.idade,
                telefone: hospede.telefone,
                cpf: hospede.cpf,
                documento: hospede.documento,
                idreserva: hospede.reservaId,
                reserva: reservaIdJestor,
            }
        };

        const response = await jestorClient.post(ENDPOINT_UPDATE, data);

        if (response.data?.status) {
            logDebug('Hóspede', `🔹 Hóspede ${hospede.nomeCompleto} atualizado com sucesso no Jestor!`);
        } else {
            logDebug('Hóspede', `⚠️ Atualização do hóspede ${hospede.nomeCompleto} no Jestor retornou um status inesperado.`);
        }

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao atualizar hóspede ${hospede.nomeCompleto} no Jestor: ${errorMessage}`);        
        throw new Error(`Erro ao atualizar hóspede ${hospede.nomeCompleto} no Jestor`);
    }
}

/**
 * Sincroniza apenas UM hóspede específico com o Jestor.
 */
export async function sincronizarHospede(hospede: typeHospede, reservaIdJestor?: number) {
    try {
        // 📥 Tenta obter o ID interno do hóspede no Jestor
        const idInterno = await obterIdInternoHospedeNoJestor(hospede.nomeCompleto, hospede.idExterno);

        if (!idInterno) {
            await inserirHospedeNoJestor(hospede, reservaIdJestor);
        } else {
            await atualizarHospedeNoJestor(hospede, idInterno, reservaIdJestor);
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
