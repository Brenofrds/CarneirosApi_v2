import jestorClient from '../../../config/jestorClient';
import { typeReserva } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor, getReservasNaoSincronizados } from '../../database/models';
import { registrarErroJestor } from '../../database/erro.service';
import prisma from '../../../config/database';
import { logDebug } from '../../../utils/logger';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_RESERVA = 'e4sqtj0lt_yjxd075da5t';

/**
 * Consulta o Jestor para verificar se a reserva existe e, se sim, retorna o ID interno.
 * 
 * @param localizador - O localizador da reserva.
 * @param idExterno - O ID externo da reserva.
 * @returns - O ID interno do Jestor ou null se a reserva não existir.
 */
export async function obterIdInternoNoJestor(localizador: string, idExterno: string) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_RESERVA,
            filters: [
                { field: 'name', value: localizador, operator: '==' },
                { field: 'id_externo', value: idExterno, operator: '==' },
            ],
        });

        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            const idInterno = items[0][`id_${JESTOR_TB_RESERVA}`];
            return idInterno ?? null;
        }

        return null;

    } catch (error: any) {
        console.error(`❌ Erro ao buscar reserva no Jestor: ${error.message}`);
        throw new Error('Erro ao buscar reserva no Jestor');
    }
}

/**
 * Insere uma reserva no Jestor.
 * @param reserva - Dados da reserva a serem inseridos.
 */
export async function inserirReservaNoJestor(reserva: typeReserva, agenteIdJestor?: number, canalIdJestor?: number, imovelIdJestor?: number) {
    try {

        logDebug('Reserva', `🔍 agenteIdJestor, canalIdJestor e imovelIdJestor recebido para reserva ${reserva.localizador}: ${agenteIdJestor}, ${canalIdJestor} e ${imovelIdJestor}`);

        const data: Record<string, any> = {
            name: reserva.localizador,
            id_bd_engnet: reserva.id,
            id_externo: reserva.idExterno,
            data_da_reserva: reserva.dataDaCriacao,
            checkin: reserva.checkIn,
            hora_checkin: reserva.horaCheckIn,
            checkout: reserva.checkOut,
            hora_checkout: reserva.horaCheckOut,
            quant_hospedes: reserva.quantidadeHospedes,
            quant_adt: reserva.quantidadeAdultos,
            quant_chd: reserva.quantidadeCriancas,
            quant_inf: reserva.quantidadeInfantil,
            moeda: reserva.moeda,
            valor_total: reserva.valorTotal,
            total_pago: reserva.totalPago,
            pendente_quitacao: reserva.pendenteQuitacao,
            total_taxas_extras: reserva.totalTaxasExtras,
            quant_diarias: reserva.quantidadeDiarias,
            partnercode: reserva.partnerCode,
            id_imovel_stays: reserva.idImovelStays,
            origem: reserva.origem,
            status1: reserva.status,
            condominio: reserva.condominio,
            regiao: reserva.regiao,
            imovel_oficial_sku: reserva.imovelOficialSku,
            observacao: reserva.observacao,
            link_stays_1: reserva.linkStays,
            agente: agenteIdJestor,
            canal_1: canalIdJestor,
            imovel: imovelIdJestor,
        };

        // Adiciona apenas se os IDs estiverem presentes
        if (reserva.imovelId) data.id_imovel = reserva.imovelId;
        if (reserva.canalId) data.canal = reserva.canalId;
        if (agenteIdJestor) data.agente = agenteIdJestor;
        if (canalIdJestor) data.canal_1 = canalIdJestor;
        if (imovelIdJestor) data.imovel = imovelIdJestor;


        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_RESERVA,
            data,
        });

        // ✅ Log simplificado de sucesso
        logDebug('Reserva', `✅ Reserva ${reserva.localizador} Inserida com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';
        console.error(`❌ Erro ao inserir reserva ${reserva.localizador} no Jestor:`, errorMessage);

        // 🔥 Registra erro na tabela ErroSincronizacao
        await registrarErroJestor("reserva", reserva.idExterno.toString(), errorMessage);
        
        throw new Error('Erro ao inserir reserva no Jestor');
    }
}



/**
 * Atualiza uma reserva existente no Jestor.
 * @param reserva - Dados da reserva a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
export async function atualizarReservaNoJestor(reserva: typeReserva, idInterno: string, agenteIdJestor?: number, canalIdJestor?: number, imovelIdJestor?: number) {
    try {

        logDebug('Reserva', `🔍 agenteIdJestor, canalIdJestor e imovelIdJestor recebido para reserva ${reserva.localizador}: ${agenteIdJestor}, ${canalIdJestor} e ${imovelIdJestor}`);
        
        const data: Record<string, any> = {
            object_type: JESTOR_TB_RESERVA,
            data: {
                [`id_${JESTOR_TB_RESERVA}`]: idInterno, // Campo obrigatório do ID interno
                name: reserva.localizador,
                id_bd_engnet: reserva.id,
                id_externo: reserva.idExterno,
                data_da_reserva: reserva.dataDaCriacao,
                checkin: reserva.checkIn,
                hora_checkin: reserva.horaCheckIn,
                checkout: reserva.checkOut,
                hora_checkout: reserva.horaCheckOut,
                quant_hospedes: reserva.quantidadeHospedes,
                quant_adt: reserva.quantidadeAdultos,
                quant_chd: reserva.quantidadeCriancas,
                quant_inf: reserva.quantidadeInfantil,
                moeda: reserva.moeda,
                valor_total: reserva.valorTotal,
                total_pago: reserva.totalPago,
                pendente_quitacao: reserva.pendenteQuitacao,
                total_taxas_extras: reserva.totalTaxasExtras,
                quant_diarias: reserva.quantidadeDiarias,
                partnercode: reserva.partnerCode,
                id_imovel_stays: reserva.idImovelStays,
                origem: reserva.origem,
                status: reserva.status,
                condominio: reserva.condominio,
                regiao: reserva.regiao,
                imovel_oficial_sku: reserva.imovelOficialSku,
                observacao: reserva.observacao,
                link_stays_1: reserva.linkStays,
                agente: agenteIdJestor,
                canal_1: canalIdJestor,
                imovel: imovelIdJestor,
            }
        };

        if (agenteIdJestor) data.agente = agenteIdJestor;
        if (canalIdJestor) data.canal_1 = canalIdJestor;
        if (imovelIdJestor) data.imovel = imovelIdJestor;


        // 🚀 Envia a solicitação de atualização ao Jestor
        const response = await jestorClient.post(ENDPOINT_UPDATE, data);

        // ✅ Log simplificado de sucesso
        logDebug('Reserva', `🔹 Reserva ${reserva.localizador} atualizada com sucesso no Jestor!`);

        return response.data;

    } catch (error: any) {
        const errorMessage = error?.response?.data || error.message || 'Erro desconhecido';

        // ❌ Log de erro simplificado
        logDebug('Erro', `❌ Erro ao atualizar reserva ${reserva.localizador} no Jestor: ${errorMessage}`);

        // 🔥 Registra erro na tabela ErroSincronizacao
        await registrarErroJestor("reserva", reserva.idExterno.toString(), errorMessage);
        
        throw new Error(`Erro ao atualizar reserva ${reserva.localizador} no Jestor`);
    }
}

/**
 * Sincroniza apenas UMA reserva específica com o Jestor.
 */
export async function sincronizarReserva(reserva: typeReserva, agenteIdJestor?: number, canalIdJestor?: number, imovelIdJestor?: number): Promise<number | null> {
    try {

        let idInterno: number | null = reserva.jestorId || null;

        // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
        if (!idInterno) {
            idInterno = await obterIdInternoNoJestor(reserva.localizador, reserva.idExterno);
        }
    
        if (!idInterno) {
            // 🔼 Inserção no Jestor com o agenteIdJestor e canalIdJestor
            const response = await inserirReservaNoJestor(reserva, agenteIdJestor, canalIdJestor, imovelIdJestor);
            idInterno = response?.data?.[`id_${JESTOR_TB_RESERVA}`];
        } else {
            // 🛠 Atualização no Jestor com o agenteIdJestor e canalIdJestor
            await atualizarReservaNoJestor(reserva, idInterno.toString(), agenteIdJestor, canalIdJestor, imovelIdJestor);
        }
    
        // ✅ Marca como sincronizado apenas se não houver erro
        await atualizaCampoSincronizadoNoJestor('reserva', reserva.localizador);

        return idInterno;
  
    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      logDebug('Erro', `❌ Erro ao sincronizar reserva ${reserva.localizador}: ${errorMessage}`);
  
      await prisma.reserva.update({
        where: { localizador: reserva.localizador },
        data: { sincronizadoNoJestor: false },
      });
  
      throw new Error(`Erro ao sincronizar reserva ${reserva.localizador}`);
    }
  }

/* funcao de teste
(async () => {
    await sincronizarReserva();
})();
*/