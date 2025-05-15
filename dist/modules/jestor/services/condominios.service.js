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
exports.obterIdInternoCondominioNoJestor = obterIdInternoCondominioNoJestor;
exports.inserirCondominioNoJestor = inserirCondominioNoJestor;
exports.atualizarCondominioNoJestor = atualizarCondominioNoJestor;
exports.sincronizarCondominio = sincronizarCondominio;
const jestorClient_1 = __importDefault(require("../../../config/jestorClient"));
const models_1 = require("../../database/models");
const logger_1 = require("../../../utils/logger");
const database_1 = __importDefault(require("../../../config/database"));
const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_CONDOMINIO = 'b30305a4f8ff36f37403e';
/**
 * Consulta o Jestor para verificar se o condomínio existe e, se sim, retorna o ID interno.
 *
 * @param idExterno - O ID externo do condomínio.
 * @param sku - O SKU do condomínio.
 * @returns - O ID interno do Jestor ou null se o condomínio não existir.
 */
function obterIdInternoCondominioNoJestor(idExterno, sku) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const response = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                object_type: JESTOR_TB_CONDOMINIO,
                filters: [
                    { field: 'id', value: idExterno, operator: '==' },
                    { field: 'name', value: sku, operator: '==' },
                ],
            });
            const items = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.items;
            if (Array.isArray(items) && items.length > 0) {
                const idInterno = items[0][`id_${JESTOR_TB_CONDOMINIO}`];
                return idInterno !== null && idInterno !== void 0 ? idInterno : null;
            }
            return null;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao buscar condomínio no Jestor: ${errorMessage}`);
            throw new Error('Erro ao buscar condomínio no Jestor');
        }
    });
}
/**
 * Insere um condomínio no Jestor.
 * @param condominio - Dados do condomínio a serem inseridos.
 */
function inserirCondominioNoJestor(condominio) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
                id_bd_engnet: condominio.id,
                id: condominio.idExterno,
                codigo: condominio.idStays,
                name: condominio.sku,
                regiao: condominio.regiao,
                status: condominio.status,
                titulo: condominio.titulo || '',
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_CREATE, {
                object_type: JESTOR_TB_CONDOMINIO,
                data,
            });
            (0, logger_1.logDebug)('Condomínio', `✅ Condomínio ${condominio.idExterno} inserido com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao inserir condomínio ${condominio.idExterno} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao inserir condomínio ${condominio.idExterno} no Jestor`);
        }
    });
}
/**
 * Atualiza um condomínio existente no Jestor.
 * @param condominio - Dados do condomínio a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
function atualizarCondominioNoJestor(condominio, idInterno) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const data = {
                object_type: JESTOR_TB_CONDOMINIO,
                data: {
                    [`id_${JESTOR_TB_CONDOMINIO}`]: idInterno,
                    id_bd_engnet: condominio.id,
                    id: condominio.idExterno,
                    codigo: condominio.idStays,
                    name: condominio.sku,
                    regiao: condominio.regiao,
                    status: condominio.status,
                    titulo: condominio.titulo || '',
                }
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_UPDATE, data);
            if ((_a = response.data) === null || _a === void 0 ? void 0 : _a.status) {
                (0, logger_1.logDebug)('Condomínio', `🔹 Condomínio ${condominio.idExterno} atualizado com sucesso no Jestor!`);
            }
            else {
                (0, logger_1.logDebug)('Condomínio', `⚠️ Atualização do condomínio ${condominio.idExterno} no Jestor retornou um status inesperado.`);
            }
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao atualizar condomínio ${condominio.idExterno} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao atualizar condomínio ${condominio.idExterno} no Jestor`);
        }
    });
}
/**
 * Sincroniza apenas UM condomínio específico com o Jestor.
 */
function sincronizarCondominio(condominio) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            let idInterno = condominio.jestorId || null;
            // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
            if (!idInterno) {
                idInterno = yield obterIdInternoCondominioNoJestor(condominio.idExterno, condominio.sku);
            }
            // 🚀 Decide entre inserir ou atualizar
            if (!idInterno) {
                const response = yield inserirCondominioNoJestor(condominio);
                idInterno = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a[`id_${JESTOR_TB_CONDOMINIO}`];
            }
            else {
                yield atualizarCondominioNoJestor(condominio, idInterno.toString());
            }
            yield (0, models_1.atualizaCampoSincronizadoNoJestor)('condominio', condominio.idExterno);
            return idInterno;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar condomínio ${condominio.idExterno}: ${errorMessage}`);
            yield database_1.default.condominio.update({
                where: { idExterno: condominio.idExterno },
                data: { sincronizadoNoJestor: false },
            });
            throw new Error(`Erro ao sincronizar condomínio ${condominio.idExterno}`);
        }
    });
}
