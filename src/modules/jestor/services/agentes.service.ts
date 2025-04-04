// agentes

import jestorClient from '../../../config/jestorClient';
import { typeAgente } from '../jestor.types';
import { atualizaCampoSincronizadoNoJestor, getAgentesNaoSincronizados } from '../../database/models';
import { registrarErroJestor } from '../../database/erro.service';
import prisma from '../../../config/database';
import { logDebug } from '../../../utils/logger';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_AGENTE = '1jxekmijxza61ygtgadfi';

/**
 * Consulta o Jestor para verificar se o agente existe e, se sim, retorna o ID interno.
 * @param idExterno - O ID externo do agente.
 * @returns - O ID interno do Jestor ou null se o agente não existir.
 */
export async function obterIdInternoAgenteNoJestor(idExterno: string) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_AGENTE,
            filters: [{ field: 'id_externo', value: idExterno, operator: '==' }],
        });

        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            return items[0][`id_${JESTOR_TB_AGENTE}`] ?? null;
        }

        return null;

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao buscar agente no Jestor: ${errorMessage}`);
        throw new Error('Erro ao buscar agente no Jestor');
    }
}

/**
 * Insere um agente no Jestor.
 * @param agente - Dados do agente a serem inseridos.
 */
export async function inserirAgenteNoJestor(agente: typeAgente) {
    try {
        const data: Record<string, any> = {
            id_api_engnet: agente.id,
            id_externo: agente.idExterno,
            name: agente.nome,
        };

        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_AGENTE,
            data,
        });

        logDebug('Agente', `✅ Agente ${agente.idExterno} inserido com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao inserir agente ${agente.idExterno} no Jestor: ${errorMessage}`);
        await registrarErroJestor('agente', agente.idExterno, errorMessage);
        throw new Error(`Erro ao inserir agente ${agente.idExterno} no Jestor`);
    }
}

/**
 * Atualiza um agente existente no Jestor.
 * @param agente - Dados do agente a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarAgenteNoJestor(agente: typeAgente, idInterno: string) {
    try {
        const data: Record<string, any> = {
            object_type: JESTOR_TB_AGENTE,
            data: {
                [`id_${JESTOR_TB_AGENTE}`]: idInterno,
                name: agente.nome,
            }
        };

        const response = await jestorClient.post(ENDPOINT_UPDATE, data);

        logDebug('Agente', `🔹 Agente ${agente.idExterno} atualizado com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao atualizar agente ${agente.idExterno} no Jestor: ${errorMessage}`);
        await registrarErroJestor('agente', agente.idExterno, errorMessage);
        throw new Error(`Erro ao atualizar agente ${agente.idExterno} no Jestor`);
    }
}

/**
 * Sincroniza apenas UM agente específico com o Jestor.
 * Usa o campo jestorId presente no agente para decidir se deve inserir ou atualizar.
 *
 * @param agente - Dados do agente, incluindo o jestorId (opcional)
 * @returns - ID interno do Jestor
 */
export async function sincronizarAgente(agente: typeAgente): Promise<number | null> {
    try {
      // 🔍 Usa o jestorId do agente (caso já tenha) para evitar nova consulta
      let idInterno: number | null = agente.jestorId || null;
  
      // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
      if (!idInterno) {
        idInterno = await obterIdInternoAgenteNoJestor(agente.idExterno);
      }
  
      // 🚀 Decide entre inserir ou atualizar
      if (!idInterno) {
        const response = await inserirAgenteNoJestor(agente);
        idInterno = response?.data?.[`id_${JESTOR_TB_AGENTE}`];
      } else {
        await atualizarAgenteNoJestor(agente, idInterno.toString());
      }
  
      // ✅ Retorna o ID interno do Jestor para salvar no banco local
      return idInterno;
  
    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      logDebug('Erro', `❌ Erro ao sincronizar agente ${agente.idExterno}: ${errorMessage}`);
  
      await prisma.agente.update({
        where: { idExterno: agente.idExterno },
        data: { sincronizadoNoJestor: false },
      });
  
      throw new Error(`Erro ao sincronizar agente ${agente.idExterno}`);
    }
  }