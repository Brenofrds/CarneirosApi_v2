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
exports.obterIdInternoProprietarioNoJestor = obterIdInternoProprietarioNoJestor;
exports.inserirProprietarioNoJestor = inserirProprietarioNoJestor;
exports.atualizarProprietarioNoJestor = atualizarProprietarioNoJestor;
exports.sincronizarProprietario = sincronizarProprietario;
const jestorClient_1 = __importDefault(require("../../../config/jestorClient"));
const models_1 = require("../../database/models");
const database_1 = __importDefault(require("../../../config/database"));
const logger_1 = require("../../../utils/logger");
const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_PROPRIETARIO = 'a3672133a5950a31442d1';
/**
 * Consulta o Jestor para verificar se o proprietário existe e, se sim, retorna o ID interno.
 *
 * @param nome - Nome do proprietário.
 * @param telefone - Telefone do proprietário.
 * @returns - O ID interno do Jestor ou null se o proprietário não existir.
 */
function obterIdInternoProprietarioNoJestor(nome, id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            // 1. Buscar pelo idExterno, se fornecido
            if (id) {
                const responseId = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                    object_type: JESTOR_TB_PROPRIETARIO,
                    filters: [{ field: 'id_bd_engnet', value: id, operator: '==' }],
                });
                const itemsId = (_b = (_a = responseId.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.items;
                if (Array.isArray(itemsId) && itemsId.length > 0) {
                    const idInterno = itemsId[0][`id_${JESTOR_TB_PROPRIETARIO}`];
                    return idInterno !== null && idInterno !== void 0 ? idInterno : null;
                }
            }
            const response = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                object_type: JESTOR_TB_PROPRIETARIO,
                filters: [
                    { field: 'proprietario_principal', value: nome, operator: '==' }
                ],
            });
            const items = (_d = (_c = response.data) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.items;
            if (Array.isArray(items) && items.length > 0) {
                const idInterno = items[0][`id_${JESTOR_TB_PROPRIETARIO}`];
                return idInterno !== null && idInterno !== void 0 ? idInterno : null;
            }
            return null;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao buscar proprietário no Jestor: ${errorMessage}`);
            throw new Error('Erro ao buscar proprietário no Jestor');
        }
    });
}
/**
 * Insere um proprietário no Jestor.
 * @param proprietario - Dados do proprietário a serem inseridos.
 */
function inserirProprietarioNoJestor(proprietario) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
                id_bd_engnet: proprietario.id,
                proprietario_principal: proprietario.nome,
                telefone: proprietario.telefone,
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_CREATE, {
                object_type: JESTOR_TB_PROPRIETARIO,
                data,
            });
            (0, logger_1.logDebug)('Proprietário', `✅ Proprietário ${proprietario.nome} inserido com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao inserir proprietário ${proprietario.nome} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao inserir proprietário ${proprietario.nome} no Jestor`);
        }
    });
}
/**
 * Atualiza um proprietário existente no Jestor.
 * @param proprietario - Dados do proprietário a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
function atualizarProprietarioNoJestor(proprietario, idInterno) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const data = {
                object_type: JESTOR_TB_PROPRIETARIO,
                data: {
                    [`id_${JESTOR_TB_PROPRIETARIO}`]: idInterno,
                    proprietario_principal: proprietario.nome,
                    telefone: proprietario.telefone,
                }
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_UPDATE, data);
            if ((_a = response.data) === null || _a === void 0 ? void 0 : _a.status) {
                (0, logger_1.logDebug)('Proprietário', `🔹 Proprietário ${proprietario.nome} atualizado com sucesso no Jestor!`);
            }
            else {
                (0, logger_1.logDebug)('Proprietário', `⚠️ Atualização do proprietário ${proprietario.nome} no Jestor retornou um status inesperado.`);
            }
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao atualizar proprietário ${proprietario.nome} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao atualizar proprietário ${proprietario.nome} no Jestor`);
        }
    });
}
/**
 * Sincroniza apenas UM proprietário específico com o Jestor.
 */
function sincronizarProprietario(proprietario) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            let idInterno = proprietario.jestorId || null;
            if (!idInterno) {
                idInterno = yield obterIdInternoProprietarioNoJestor(proprietario.nome, proprietario.id);
            }
            if (!idInterno) {
                const response = yield inserirProprietarioNoJestor(proprietario);
                idInterno = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a[`id_${JESTOR_TB_PROPRIETARIO}`];
            }
            else {
                yield atualizarProprietarioNoJestor(proprietario, idInterno.toString());
            }
            yield (0, models_1.atualizaCampoSincronizadoNoJestor)('proprietario', proprietario.id);
            return idInterno;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar proprietário ${proprietario.nome}: ${errorMessage}`);
            yield database_1.default.proprietario.update({
                where: { id: proprietario.id },
                data: { sincronizadoNoJestor: false },
            });
            throw new Error(`Erro ao sincronizar proprietário ${proprietario.nome}`);
        }
    });
}
