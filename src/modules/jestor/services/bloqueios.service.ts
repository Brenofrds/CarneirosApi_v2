import jestorClient from '../../../config/jestorClient';
import { typeBloqueio } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor, getBloqueiosNaoSincronizados } from '../../database/models';
import { registrarErroJestor } from '../../database/erro.service';
import prisma from '../../../config/database';
import { logDebug } from '../../../utils/logger';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_BLOQUEIO = 'de73ef4153629b84eaa28';

/**
 * Consulta o Jestor para verificar se o bloqueio existe e, se sim, retorna o ID interno.
 * @param localizador - O localizador do bloqueio (armazenado no campo "name").
 * @returns - O ID interno do Jestor ou null se o bloqueio não existir.
 */
export async function obterIdInternoBloqueioNoJestor(localizador: string) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_BLOQUEIO,
            filters: [{ field: 'name', value: localizador, operator: '==' }],
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
            id_bd_engnet: bloqueio.id,
            id_externo: bloqueio.idExterno,
            name: bloqueio.localizador,
            checkin: bloqueio.checkIn,
            checkout: bloqueio.checkOut,
            hora_checkin: bloqueio.horaCheckIn,
            hora_checkout: bloqueio.horaCheckOut,
            nota_interna: bloqueio.notaInterna,
            imovelid: bloqueio.imovelId,
            apartamento: imovelIdJestor,
            status: bloqueio.status,
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
                id_bd_engnet: bloqueio.id,
                id_externo: bloqueio.idExterno,
                name: bloqueio.localizador,
                checkin: bloqueio.checkIn,
                checkout: bloqueio.checkOut,
                hora_checkin: bloqueio.horaCheckIn,
                hora_checkout: bloqueio.horaCheckOut,
                nota_interna: bloqueio.notaInterna,
                imovelid: bloqueio.imovelId,
                apartamento: imovelIdJestor,
                status: bloqueio.status,
            },
        };

        const response = await jestorClient.post(ENDPOINT_UPDATE, data);

        logDebug('Bloqueio', `🔹 Bloqueio ${bloqueio.idExterno} atualizado com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';

        logDebug('Erro', `❌ Erro ao atualizar bloqueio ${bloqueio.idExterno} no Jestor: ${errorMessage}`);

        throw new Error(`Erro ao atualizar bloqueio ${bloqueio.idExterno} no Jestor`);
    }
}

/**
 * Sincroniza apenas UM bloqueio específico com o Jestor.
 */
export async function sincronizarBloqueio(bloqueio: typeBloqueio, imovelIdJestor?: number): Promise<number | null> {
    try {
      let idInterno: number | null = bloqueio.jestorId || null;
  
      // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
      if (!idInterno) {
        idInterno = await obterIdInternoBloqueioNoJestor(bloqueio.localizador);
      }
  
      // 🚀 Decide entre inserir ou atualizar
      if (!idInterno) {
        const response = await inserirBloqueioNoJestor(bloqueio, imovelIdJestor);
        idInterno = response?.data?.[`id_${JESTOR_TB_BLOQUEIO}`];
      } else {
        await atualizarBloqueioNoJestor(bloqueio, idInterno.toString(), imovelIdJestor);
      }
  
      // 🟢 Atualiza sincronização no banco
      await prisma.bloqueio.update({
        where: { idExterno: bloqueio.idExterno },
        data: {
          sincronizadoNoJestor: true,
          jestorId: idInterno,
        },
      });
  
      return idInterno;
  
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