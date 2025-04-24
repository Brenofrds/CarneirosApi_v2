"use strict";
// agentes
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
exports.obterIdInternoAgenteNoJestor = obterIdInternoAgenteNoJestor;
exports.inserirAgenteNoJestor = inserirAgenteNoJestor;
exports.atualizarAgenteNoJestor = atualizarAgenteNoJestor;
exports.sincronizarAgente = sincronizarAgente;
const jestorClient_1 = __importDefault(require("../../../config/jestorClient"));
const database_1 = __importDefault(require("../../../config/database"));
const logger_1 = require("../../../utils/logger");
const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_AGENTE = '1jxekmijxza61ygtgadfi';
/**
 * Consulta o Jestor para verificar se o agente existe e, se sim, retorna o ID interno.
 * @param idExterno - O ID externo do agente.
 * @returns - O ID interno do Jestor ou null se o agente não existir.
 */
function obterIdInternoAgenteNoJestor(idExterno) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const response = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                object_type: JESTOR_TB_AGENTE,
                filters: [{ field: 'id_externo', value: idExterno, operator: '==' }],
            });
            const items = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.items;
            if (Array.isArray(items) && items.length > 0) {
                return (_c = items[0][`id_${JESTOR_TB_AGENTE}`]) !== null && _c !== void 0 ? _c : null;
            }
            return null;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao buscar agente no Jestor: ${errorMessage}`);
            throw new Error('Erro ao buscar agente no Jestor');
        }
    });
}
/**
 * Insere um agente no Jestor.
 * @param agente - Dados do agente a serem inseridos.
 */
function inserirAgenteNoJestor(agente) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
                id_api_engnet: agente.id,
                id_externo: agente.idExterno,
                name: agente.nome,
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_CREATE, {
                object_type: JESTOR_TB_AGENTE,
                data,
            });
            (0, logger_1.logDebug)('Agente', `✅ Agente ${agente.idExterno} inserido com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao inserir agente ${agente.idExterno} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao inserir agente ${agente.idExterno} no Jestor`);
        }
    });
}
/**
 * Atualiza um agente existente no Jestor.
 * @param agente - Dados do agente a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
function atualizarAgenteNoJestor(agente, idInterno) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
                object_type: JESTOR_TB_AGENTE,
                data: {
                    [`id_${JESTOR_TB_AGENTE}`]: idInterno,
                    name: agente.nome,
                }
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_UPDATE, data);
            (0, logger_1.logDebug)('Agente', `🔹 Agente ${agente.idExterno} atualizado com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao atualizar agente ${agente.idExterno} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao atualizar agente ${agente.idExterno} no Jestor`);
        }
    });
}
/**
 * Sincroniza apenas UM agente específico com o Jestor.
 * Usa o campo jestorId presente no agente para decidir se deve inserir ou atualizar.
 *
 * @param agente - Dados do agente, incluindo o jestorId (opcional)
 * @returns - ID interno do Jestor
 */
function sincronizarAgente(agente) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // 🔍 Usa o jestorId do agente (caso já tenha) para evitar nova consulta
            let idInterno = agente.jestorId || null;
            // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
            if (!idInterno) {
                idInterno = yield obterIdInternoAgenteNoJestor(agente.idExterno);
            }
            // 🚀 Decide entre inserir ou atualizar
            if (!idInterno) {
                const response = yield inserirAgenteNoJestor(agente);
                idInterno = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a[`id_${JESTOR_TB_AGENTE}`];
            }
            else {
                yield atualizarAgenteNoJestor(agente, idInterno.toString());
            }
            // ✅ Retorna o ID interno do Jestor para salvar no banco local
            return idInterno;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar agente ${agente.idExterno}: ${errorMessage}`);
            yield database_1.default.agente.update({
                where: { idExterno: agente.idExterno },
                data: { sincronizadoNoJestor: false },
            });
            throw new Error(`Erro ao sincronizar agente ${agente.idExterno}`);
        }
    });
}
