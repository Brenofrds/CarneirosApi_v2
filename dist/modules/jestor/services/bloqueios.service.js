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
exports.obterIdInternoBloqueioNoJestor = obterIdInternoBloqueioNoJestor;
exports.inserirBloqueioNoJestor = inserirBloqueioNoJestor;
exports.atualizarBloqueioNoJestor = atualizarBloqueioNoJestor;
exports.sincronizarBloqueio = sincronizarBloqueio;
const jestorClient_1 = __importDefault(require("../../../config/jestorClient"));
const database_1 = __importDefault(require("../../../config/database"));
const logger_1 = require("../../../utils/logger");
const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_BLOQUEIO = 'de73ef4153629b84eaa28';
/**
 * Consulta o Jestor para verificar se o bloqueio existe e, se sim, retorna o ID interno.
 * @param idExterno - O ID externo do bloqueio.
 * @returns - O ID interno do Jestor ou null se o bloqueio não existir.
 */
function obterIdInternoBloqueioNoJestor(idExterno) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const response = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                object_type: JESTOR_TB_BLOQUEIO,
                filters: [{ field: 'id_externo', value: idExterno, operator: '==' }],
            });
            const items = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.items;
            if (Array.isArray(items) && items.length > 0) {
                return (_c = items[0][`id_${JESTOR_TB_BLOQUEIO}`]) !== null && _c !== void 0 ? _c : null;
            }
            return null;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao buscar bloqueio no Jestor: ${errorMessage}`);
            throw new Error('Erro ao buscar bloqueio no Jestor');
        }
    });
}
/**
 * Insere um bloqueio no Jestor.
 * @param bloqueio - Dados do bloqueio a serem inseridos.
 */
function inserirBloqueioNoJestor(bloqueio, imovelIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
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
            const response = yield jestorClient_1.default.post(ENDPOINT_CREATE, {
                object_type: JESTOR_TB_BLOQUEIO,
                data,
            });
            (0, logger_1.logDebug)('Bloqueio', `✅ Bloqueio ${bloqueio.idExterno} inserido com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao inserir bloqueio ${bloqueio.idExterno} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao inserir bloqueio ${bloqueio.idExterno} no Jestor`);
        }
    });
}
/**
 * Atualiza um bloqueio existente no Jestor.
 * @param bloqueio - Dados do bloqueio a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
function atualizarBloqueioNoJestor(bloqueio, idInterno, imovelIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            (0, logger_1.logDebug)('Bloqueio', `🔍 imovelIdJestor recebido para bloqueio ${bloqueio.idExterno}: ${imovelIdJestor}`);
            const data = {
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
            const response = yield jestorClient_1.default.post(ENDPOINT_UPDATE, data);
            (0, logger_1.logDebug)('Bloqueio', `🔹 Bloqueio ${bloqueio.idExterno} atualizado com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao atualizar bloqueio ${bloqueio.idExterno} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao atualizar bloqueio ${bloqueio.idExterno} no Jestor`);
        }
    });
}
/**
 * Sincroniza apenas UM bloqueio específico com o Jestor.
 */
function sincronizarBloqueio(bloqueio, imovelIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            let idInterno = bloqueio.jestorId || null;
            // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
            if (!idInterno) {
                idInterno = yield obterIdInternoBloqueioNoJestor(bloqueio.idExterno);
            }
            // 🚀 Decide entre inserir ou atualizar
            if (!idInterno) {
                const response = yield inserirBloqueioNoJestor(bloqueio, imovelIdJestor);
                idInterno = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a[`id_${JESTOR_TB_BLOQUEIO}`];
            }
            else {
                yield atualizarBloqueioNoJestor(bloqueio, idInterno.toString(), imovelIdJestor);
            }
            // 🟢 Atualiza sincronização no banco
            yield database_1.default.bloqueio.update({
                where: { idExterno: bloqueio.idExterno },
                data: {
                    sincronizadoNoJestor: true,
                    jestorId: idInterno,
                },
            });
            return idInterno;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar bloqueio ${bloqueio.idExterno}: ${errorMessage}`);
            yield database_1.default.bloqueio.update({
                where: { idExterno: bloqueio.idExterno },
                data: { sincronizadoNoJestor: false },
            });
            throw new Error(`Erro ao sincronizar bloqueio ${bloqueio.idExterno}`);
        }
    });
}
