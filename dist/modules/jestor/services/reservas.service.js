"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obterIdInternoNoJestor = obterIdInternoNoJestor;
exports.inserirReservaNoJestor = inserirReservaNoJestor;
exports.atualizarReservaNoJestor = atualizarReservaNoJestor;
exports.sincronizarReserva = sincronizarReserva;
const jestorClient_1 = __importDefault(require("../../../config/jestorClient"));
const models_1 = require("../../database/models");
const database_1 = __importDefault(require("../../../config/database"));
const logger_1 = require("../../../utils/logger");
const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_RESERVA = 'b03f6af310a8f26667439';
/**
 * Consulta o Jestor para verificar se a reserva existe e, se sim, retorna o ID interno.
 *
 * @param localizador - O localizador da reserva.
 * @param idExterno - O ID externo da reserva.
 * @returns - O ID interno do Jestor ou null se a reserva não existir.
 */
function obterIdInternoNoJestor(localizador, idExterno) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const response = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                object_type: JESTOR_TB_RESERVA,
                filters: [
                    { field: 'name', value: localizador, operator: '==' },
                    { field: 'id_externo', value: idExterno, operator: '==' },
                ],
            });
            const items = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.items;
            if (Array.isArray(items) && items.length > 0) {
                const idInterno = items[0][`id_${JESTOR_TB_RESERVA}`];
                return idInterno !== null && idInterno !== void 0 ? idInterno : null;
            }
            return null;
        }
        catch (error) {
            console.error(`❌ Erro ao buscar reserva no Jestor: ${error.message}`);
            throw new Error('Erro ao buscar reserva no Jestor');
        }
    });
}
/**
 * Insere uma reserva no Jestor.
 * @param reserva - Dados da reserva a serem inseridos.
 */
function inserirReservaNoJestor(reserva, agenteIdJestor, canalIdJestor, imovelIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            (0, logger_1.logDebug)('Reserva', `🔍 agenteIdJestor, canalIdJestor e imovelIdJestor recebido para reserva ${reserva.localizador}: ${agenteIdJestor}, ${canalIdJestor} e ${imovelIdJestor}`);
            const data = {
                name: reserva.localizador,
                id_bd_engnet: reserva.id,
                id_externo: reserva.idExterno,
                data_da_reserva: reserva.dataDaCriacao,
                checkin: reserva.checkIn,
                hora_checkin: reserva.horaCheckIn,
                checkout: reserva.checkOut,
                data_de_recolhimento: reserva.checkOut,
                hora_checkout: reserva.horaCheckOut,
                quantidade_de_hospedes: reserva.quantidadeHospedes,
                quantidade_adt: reserva.quantidadeAdultos,
                quantidade_chd: reserva.quantidadeCriancas,
                quantidade_inf: reserva.quantidadeInfantil,
                moeda: reserva.moeda,
                valor_total: reserva.valorTotal,
                total_pago: reserva.totalPago,
                pendente_quitacao_1: reserva.pendenteQuitacao,
                total_taxas_extras: reserva.totalTaxasExtras,
                quantidade_de_diarias: reserva.quantidadeDiarias,
                partnercode: reserva.partnerCode,
                id_imovel_stays_1: reserva.idImovelStays,
                origem_canal: reserva.origem || "Reserva Direta",
                status: reserva.status,
                condominio_1: reserva.condominio,
                regiao_1: reserva.regiao,
                imovel_oficial_sku: reserva.imovelOficialSku,
                observacoes: reserva.observacao,
                link_stays_2: reserva.linkStays,
                agente: agenteIdJestor,
                canal: canalIdJestor,
                apartamento: imovelIdJestor,
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_CREATE, {
                object_type: JESTOR_TB_RESERVA,
                data,
            });
            // ✅ Log simplificado de sucesso
            (0, logger_1.logDebug)('Reserva', `✅ Reserva ${reserva.localizador} Inserida com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            console.error(`❌ Erro ao inserir reserva ${reserva.localizador} no Jestor:`, errorMessage);
            throw new Error('Erro ao inserir reserva no Jestor');
        }
    });
}
/**
 * Atualiza uma reserva existente no Jestor.
 * @param reserva - Dados da reserva a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
function atualizarReservaNoJestor(reserva, idInterno, agenteIdJestor, canalIdJestor, imovelIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            (0, logger_1.logDebug)('Reserva', `🔍 agenteIdJestor, canalIdJestor e imovelIdJestor recebido para reserva ${reserva.localizador}: ${agenteIdJestor}, ${canalIdJestor} e ${imovelIdJestor}`);
            const data = {
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
                    data_de_recolhimento: reserva.checkOut,
                    hora_checkout: reserva.horaCheckOut,
                    quantidade_de_hospedes: reserva.quantidadeHospedes,
                    quantidade_adt: reserva.quantidadeAdultos,
                    quantidade_chd: reserva.quantidadeCriancas,
                    quantidade_inf: reserva.quantidadeInfantil,
                    moeda: reserva.moeda,
                    valor_total: reserva.valorTotal,
                    total_pago: reserva.totalPago,
                    pendente_quitacao_1: reserva.pendenteQuitacao,
                    total_taxas_extras: reserva.totalTaxasExtras,
                    quantidade_de_diarias: reserva.quantidadeDiarias,
                    partnercode: reserva.partnerCode,
                    id_imovel_stays_1: reserva.idImovelStays,
                    origem_canal: reserva.origem || "Reserva Direta",
                    status: reserva.status,
                    condominio_1: reserva.condominio,
                    regiao_1: reserva.regiao,
                    imovel_oficial_sku: reserva.imovelOficialSku,
                    observacoes: reserva.observacao,
                    link_stays_2: reserva.linkStays,
                    agente: agenteIdJestor,
                    canal: canalIdJestor,
                    apartamento: imovelIdJestor,
                }
            };
            // 🚀 Envia a solicitação de atualização ao Jestor
            const response = yield jestorClient_1.default.post(ENDPOINT_UPDATE, data);
            // ✅ Log simplificado de sucesso
            (0, logger_1.logDebug)('Reserva', `🔹 Reserva ${reserva.localizador} atualizada com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao atualizar reserva ${reserva.localizador} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao atualizar reserva ${reserva.localizador} no Jestor`);
        }
    });
}
/**
 * Sincroniza apenas UMA reserva específica com o Jestor.
 */
function sincronizarReserva(reserva, agenteIdJestor, canalIdJestor, imovelIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            let idInterno = reserva.jestorId || null;
            // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
            if (!idInterno) {
                idInterno = yield obterIdInternoNoJestor(reserva.localizador, reserva.idExterno);
            }
            if (!idInterno) {
                // 🔼 Inserção no Jestor com o agenteIdJestor e canalIdJestor
                const response = yield inserirReservaNoJestor(reserva, agenteIdJestor, canalIdJestor, imovelIdJestor);
                idInterno = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a[`id_${JESTOR_TB_RESERVA}`];
            }
            else {
                // 🛠 Atualização no Jestor com o agenteIdJestor e canalIdJestor
                yield atualizarReservaNoJestor(reserva, idInterno.toString(), agenteIdJestor, canalIdJestor, imovelIdJestor);
            }
            // ✅ Marca como sincronizado apenas se não houver erro
            yield (0, models_1.atualizaCampoSincronizadoNoJestor)('reserva', reserva.localizador);
            return idInterno;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar reserva ${reserva.localizador}: ${errorMessage}`);
            yield database_1.default.reserva.update({
                where: { localizador: reserva.localizador },
                data: { sincronizadoNoJestor: false },
            });
            throw new Error(`Erro ao sincronizar reserva ${reserva.localizador}`);
        }
    });
}
/* funcao de teste
(async () => {
    await sincronizarReserva();
})();
*/ 
