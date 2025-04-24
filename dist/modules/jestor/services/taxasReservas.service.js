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
exports.obterIdInternoTaxaReservaNoJestor = obterIdInternoTaxaReservaNoJestor;
exports.inserirTaxaReservaNoJestor = inserirTaxaReservaNoJestor;
exports.atualizarTaxaReservaNoJestor = atualizarTaxaReservaNoJestor;
exports.sincronizarTaxaReserva = sincronizarTaxaReserva;
const jestorClient_1 = __importDefault(require("../../../config/jestorClient"));
const models_1 = require("../../database/models");
const logger_1 = require("../../../utils/logger");
const database_1 = __importDefault(require("../../../config/database"));
const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_TAXARESERVA = '7l02yg9daf48d5cfmzbsm';
const JESTOR_TB_RESERVA = 'e4sqtj0lt_yjxd075da5t';
/**
 * Consulta o Jestor para verificar se a taxa de reserva existe e, se sim, retorna o ID interno.
 *
 * @param id - O ID da taxa de reserva.
 * @param nome - O nome da taxa de reserva.
 * @returns - O ID interno do Jestor ou null se a taxa de reserva não existir.
 */
function obterIdInternoTaxaReservaNoJestor(id, nome) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const response = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                object_type: JESTOR_TB_TAXARESERVA,
                filters: [
                    { field: 'idbdapi', value: id, operator: '==' },
                    { field: 'nometaxa', value: nome, operator: '==' },
                ],
            });
            const items = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.items;
            if (Array.isArray(items) && items.length > 0) {
                const idInterno = items[0][`id_${JESTOR_TB_TAXARESERVA}`];
                return idInterno !== null && idInterno !== void 0 ? idInterno : null;
            }
            return null;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao buscar taxa de reserva no Jestor: ${errorMessage}`);
            throw new Error('Erro ao buscar taxa de reserva no Jestor');
        }
    });
}
/**
 * Insere uma taxa de reserva no Jestor.
 * @param taxaReserva - Dados da taxa de reserva a serem inseridos.
 */
function inserirTaxaReservaNoJestor(taxaReserva, reservaIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
                idbdapi: taxaReserva.id,
                reservaid: taxaReserva.reservaId,
                nometaxa: taxaReserva.name,
                valor: taxaReserva.valor,
                testengnet_reservas: reservaIdJestor,
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_CREATE, {
                object_type: JESTOR_TB_TAXARESERVA,
                data,
            });
            (0, logger_1.logDebug)('TaxaReserva', `✅ TaxaReserva ${taxaReserva.name} inserida com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao inserir taxa de reserva ${taxaReserva.name} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao inserir taxa de reserva ${taxaReserva.name} no Jestor`);
        }
    });
}
/**
 * Atualiza uma taxa de reserva existente no Jestor.
 * @param taxaReserva - Dados da taxa de reserva a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
function atualizarTaxaReservaNoJestor(taxaReserva, idInterno, reservaIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const data = {
                object_type: JESTOR_TB_TAXARESERVA,
                data: {
                    [`id_${JESTOR_TB_TAXARESERVA}`]: idInterno,
                    reservaid: taxaReserva.reservaId,
                    nometaxa: taxaReserva.name,
                    valor: taxaReserva.valor,
                    testengnet_reservas: reservaIdJestor,
                }
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_UPDATE, data);
            if ((_a = response.data) === null || _a === void 0 ? void 0 : _a.status) {
                (0, logger_1.logDebug)('TaxaReserva', `🔹 TaxaReserva ${taxaReserva.name} atualizada com sucesso no Jestor!`);
            }
            else {
                (0, logger_1.logDebug)('TaxaReserva', `⚠️ Atualização da taxa de reserva ${taxaReserva.name} no Jestor retornou um status inesperado.`);
            }
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao atualizar taxa de reserva ${taxaReserva.name} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao atualizar taxa de reserva ${taxaReserva.name} no Jestor`);
        }
    });
}
/**
 * Sincroniza apenas UMA taxa de reserva específica com o Jestor.
 */
function sincronizarTaxaReserva(taxaReserva, reservaIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const idInterno = yield obterIdInternoTaxaReservaNoJestor(taxaReserva.id, taxaReserva.name);
            if (!idInterno) {
                yield inserirTaxaReservaNoJestor(taxaReserva, reservaIdJestor);
            }
            else {
                yield atualizarTaxaReservaNoJestor(taxaReserva, idInterno, reservaIdJestor);
            }
            yield (0, models_1.atualizaCampoSincronizadoNoJestor)('taxaReserva', taxaReserva.id.toString());
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar taxa de reserva ${taxaReserva.name}: ${errorMessage}`);
            yield database_1.default.taxaReserva.update({
                where: { id: taxaReserva.id },
                data: { sincronizadoNoJestor: false },
            });
            throw new Error(`Erro ao sincronizar taxa de reserva ${taxaReserva.name}`);
        }
    });
}
