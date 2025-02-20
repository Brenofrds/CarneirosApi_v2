import jestorClient from '../../../config/jestorClient';
import { typeReserva } from '../jestor.types'; 
import { atualizaCampoSincronizadoNoJestor, getReservasNaoSincronizados } from '../../database/models';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const JESTOR_TB_RESERVA = 'e4sqtj0lt_yjxd075da5t';

/**
 * Verifica se uma reserva com o LOCALIZADOR fornecido já existe na tabela do Jestor.
 * @param localizador - Localizador da reserva a ser verificado.
 * @returns - Um boolean indicando se a reserva já existe no Jestor.
 */

export async function verificarReservaNoJestor(
    localizador: string, 
    idExterno: string
) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_TB_RESERVA, // ID da tabela no Jestor
            filters: [
                {
                    field: 'name', // localizador
                    value: localizador,
                    operator: '==', // Operador para comparação
                },
                {
                    field: 'id_externo',
                    value: idExterno,
                    operator: '==',
                },
            ],
        });
        /* para depuracao
        console.log("--------------------------------------------------");
        console.log('Resposta da API do Jestor:\n\n', JSON.stringify(response.data, null, 2));
        console.log("--------------------------------------------------");
        */
        // Garante que items está definido antes de verificar o tamanho
        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            return true; // reserva existe
        }

        return false; // reserva não existe
    } catch (error: any) {
        console.error('Erro ao verificar reserva no Jestor:', error.message);
        throw new Error('Erro ao verificar reserva no Jestor');
    }
}

/**
 * Insere uma reserva no Jestor.
 * @param reserva - Dados da reserva a serem inseridos.
 */
export async function inserirReservaNoJestor(reserva: typeReserva) {
    
    try {
        // nome do campo no Jestor | nome do campo no banco de dados local
        const data: any = {
            name: reserva.localizador,
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
            link_stays: reserva.linkStays,
            id_imovel_stays: reserva.idImovelStays,//idImovelStays = imovelId [?]
            id_imovel: reserva.imovelId,//nao tem na original
            canal: reserva.canalId,//canalId = origem [?]
            origem: reserva.origem,
            status: reserva.status,
            condominio: reserva.condominio,
            regiao: reserva.regiao,
            imovel_oficial_sku: reserva.imovelOficialSku,//imovelOficialSku = imovelId [?]
        };

        // Se ImovelId e CanalId forem null, nao adicionamos ao objeto que que sera enviado ao jestor
        if(reserva.imovelId !== null) data.id_imovel = reserva.imovelId;
        if(reserva.canalId !== null) data.canal = reserva.canalId;

        // Envia os dados pro Jestor
        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_TB_RESERVA, // ID da tabela no Jestor
            data,
        });
        /* para depuracao
        console.log("--------------------------------------------------");
        console.log('Reserva inserida no Jestor:\n\n', response.data);
        console.log("--------------------------------------------------");
        */
        return response.data; // Retorna o dado inserido
        
    } catch (error: any) {
        console.error('Erro ao inserir reserva no Jestor:', error?.response?.data || error.message || error);
        throw new Error('Erro ao inserir reserva no Jestor');
    }
}

/**
 * Sincroniza as reservas nao sincronizados do banco local com o Jestor.
 */
export async function sincronizarReserva() {
    try {
        const reservasNaoSincronizados = await getReservasNaoSincronizados();

        if(reservasNaoSincronizados){
            for (const reserva of reservasNaoSincronizados) {
                const existeNoJestor = await verificarReservaNoJestor(reserva.localizador, reserva.idExterno);
       
                if (!existeNoJestor) {
                    await inserirReservaNoJestor(reserva);
                    console.log("--------------------------------------------------");    
                    console.log(`Reserva: ${reserva.localizador}\nSincronizado com sucesso!`);

                } else {
                    console.log("--------------------------------------------------");
                    console.log(`Reserva: ${reserva.localizador}\nJa existe no Jestor. Atualizado no banco local.`);

                }
                // Atualiza o status no banco local para sincronizado
                await atualizaCampoSincronizadoNoJestor('reserva', reserva.localizador);
            }
        }
    } catch (error: any) {
        console.error('Erro ao sincronizar reserva:', error.message);
    }
}

/* funcao de teste
(async () => {
    await sincronizarReserva();
})();
*/