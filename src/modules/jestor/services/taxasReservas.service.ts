import jestorClient from '../../../config/jestorClient';
import { typeTaxaReserva } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor } from '../../database/models';
import { registrarErroJestor } from '../../database/erro.service';
import { logDebug } from '../../../utils/logger';
import prisma from '../../../config/database';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_TAXARESERVA = 'nilxosn73_05mr38wy28l';

/**
 * Consulta o Jestor para verificar se a taxa de reserva existe e, se sim, retorna o ID interno.
 * 
 * @param nome - O nome da taxa de reserva.
 * @param reservaIdJestor - ID interno da reserva no Jestor.
 * @returns - O ID interno do Jestor ou null se a taxa de reserva não existir.
 */
export async function obterIdInternoTaxaReservaNoJestor(nome: string, reservaIdJestor: number) {
  try {
    const response = await jestorClient.post(ENDPOINT_LIST, {
      object_type: JESTOR_TB_TAXARESERVA,
      filters: [
        { field: 'name', value: nome, operator: '==' },
        { field: 'reserva', value: reservaIdJestor, operator: '==' },
      ],
    });

    const items = response.data?.data?.items;

    if (Array.isArray(items) && items.length > 0) {
      const idInterno = items[0][`id_${JESTOR_TB_TAXARESERVA}`];
      return idInterno ?? null;
    }

    return null;

  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';
    logDebug('Erro', `❌ Erro ao buscar taxa de reserva no Jestor: ${errorMessage}`);
    throw new Error('Erro ao buscar taxa de reserva no Jestor');
  }
}


/**
 * Insere uma taxa de reserva no Jestor.
 * @param taxaReserva - Dados da taxa de reserva a serem inseridos.
 */
export async function inserirTaxaReservaNoJestor(taxaReserva: typeTaxaReserva, reservaIdJestor?: number) {
    try {

        const data: Record<string, any> = {
            id_bd_engnet: taxaReserva.id,
            reserva_id: taxaReserva.reservaId,
            name: taxaReserva.name,
            valor: taxaReserva.valor,
            reserva: reservaIdJestor,
        };

        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_TAXARESERVA,
            data,
        });

        logDebug('TaxaReserva', `✅ TaxaReserva ${taxaReserva.name} inserida com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao inserir taxa de reserva ${taxaReserva.name} no Jestor: ${errorMessage}`);
        throw new Error(`Erro ao inserir taxa de reserva ${taxaReserva.name} no Jestor`);
    }
}

/**
 * Atualiza uma taxa de reserva existente no Jestor.
 * @param taxaReserva - Dados da taxa de reserva a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarTaxaReservaNoJestor(taxaReserva: typeTaxaReserva, idInterno: string, reservaIdJestor?: number) {
    try {
        const data: Record<string, any> = {
            object_type: JESTOR_TB_TAXARESERVA,
            data: {
                [`id_${JESTOR_TB_TAXARESERVA}`]: idInterno,
                reservaid: taxaReserva.reservaId,
                nometaxa: taxaReserva.name,
                valor: taxaReserva.valor,
                testengnet_reservas: reservaIdJestor,
            }
        };

        const response = await jestorClient.post(ENDPOINT_UPDATE, data);

        if (response.data?.status) {
            logDebug('TaxaReserva', `🔹 TaxaReserva ${taxaReserva.name} atualizada com sucesso no Jestor!`);
        } else {
            logDebug('TaxaReserva', `⚠️ Atualização da taxa de reserva ${taxaReserva.name} no Jestor retornou um status inesperado.`);
        }

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao atualizar taxa de reserva ${taxaReserva.name} no Jestor: ${errorMessage}`);
        throw new Error(`Erro ao atualizar taxa de reserva ${taxaReserva.name} no Jestor`);
    }
}





/**
 * Sincroniza apenas UMA taxa de reserva específica com o Jestor.
 */
export async function sincronizarTaxaReserva(taxaReserva: typeTaxaReserva, reservaIdJestor?: number) {
    try {
        if (!reservaIdJestor) {
            throw new Error('reservaIdJestor não pode ser undefined');
            }
        const idInterno = await obterIdInternoTaxaReservaNoJestor(taxaReserva.name, reservaIdJestor);

        if (!idInterno) {
            await inserirTaxaReservaNoJestor(taxaReserva, reservaIdJestor);
        } else {
            await atualizarTaxaReservaNoJestor(taxaReserva, idInterno, reservaIdJestor);
        }

        await atualizaCampoSincronizadoNoJestor('taxaReserva', taxaReserva.id.toString());

    } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';

        logDebug('Erro', `❌ Erro ao sincronizar taxa de reserva ${taxaReserva.name}: ${errorMessage}`);
        await prisma.taxaReserva.update({
            where: { id: taxaReserva.id },
            data: { sincronizadoNoJestor: false },
        });

        throw new Error(`Erro ao sincronizar taxa de reserva ${taxaReserva.name}`);
    }
}