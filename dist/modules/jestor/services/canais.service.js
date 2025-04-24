"use strict";
// Canal
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
exports.obterIdInternoCanalNoJestor = obterIdInternoCanalNoJestor;
exports.inserirCanalNoJestor = inserirCanalNoJestor;
exports.atualizarCanalNoJestor = atualizarCanalNoJestor;
exports.sincronizarCanal = sincronizarCanal;
const jestorClient_1 = __importDefault(require("../../../config/jestorClient"));
const erro_service_1 = require("../../database/erro.service");
const database_1 = __importDefault(require("../../../config/database"));
const logger_1 = require("../../../utils/logger");
const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_CANAL = '1gr5oeddpkkkxjula510g';
/**
 * Consulta o Jestor para verificar se o canal existe e, se sim, retorna o ID interno.
 * @param idExterno - O ID externo do canal.
 * @returns - O ID interno do Jestor ou null se o canal não existir.
 */
function obterIdInternoCanalNoJestor(idExterno) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const response = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                object_type: JESTOR_TB_CANAL,
                filters: [{ field: 'idexterno', value: idExterno, operator: '==' }],
            });
            const items = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.items;
            if (Array.isArray(items) && items.length > 0) {
                return (_c = items[0][`id_${JESTOR_TB_CANAL}`]) !== null && _c !== void 0 ? _c : null;
            }
            return null;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao buscar canal no Jestor: ${errorMessage}`);
            throw new Error('Erro ao buscar canal no Jestor');
        }
    });
}
/**
 * Insere um canal no Jestor.
 * @param canal - Dados do canal a serem inseridos.
 */
function inserirCanalNoJestor(canal) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
                idbdapi: canal.id,
                idexterno: canal.idExterno,
                titulo: canal.titulo,
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_CREATE, {
                object_type: JESTOR_TB_CANAL,
                data,
            });
            (0, logger_1.logDebug)('Canal', `✅ Canal ${canal.idExterno} inserido com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao inserir canal ${canal.idExterno} no Jestor: ${errorMessage}`);
            yield (0, erro_service_1.registrarErroJestor)('canal', canal.idExterno, errorMessage);
            throw new Error(`Erro ao inserir canal ${canal.idExterno} no Jestor`);
        }
    });
}
/**
 * Atualiza um canal existente no Jestor.
 * @param canal - Dados do canal a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
function atualizarCanalNoJestor(canal, idInterno) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
                object_type: JESTOR_TB_CANAL,
                data: {
                    [`id_${JESTOR_TB_CANAL}`]: idInterno,
                    titulo: canal.titulo,
                }
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_UPDATE, data);
            (0, logger_1.logDebug)('Canal', `🔹 Canal ${canal.idExterno} atualizado com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao atualizar canal ${canal.idExterno} no Jestor: ${errorMessage}`);
            yield (0, erro_service_1.registrarErroJestor)('canal', canal.idExterno, errorMessage);
            throw new Error(`Erro ao atualizar canal ${canal.idExterno} no Jestor`);
        }
    });
}
/**
 * Sincroniza apenas UM canal específico com o Jestor.
 */
function sincronizarCanal(canal) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // 🔍 Usa o jestorId do canal (caso já tenha) para evitar nova consulta
            let idInterno = canal.jestorId || null;
            // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
            if (!idInterno) {
                idInterno = yield obterIdInternoCanalNoJestor(canal.idExterno);
            }
            if (!idInterno) {
                const response = yield inserirCanalNoJestor(canal);
                idInterno = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a[`id_${JESTOR_TB_CANAL}`];
            }
            else {
                yield atualizarCanalNoJestor(canal, idInterno.toString());
            }
            return idInterno;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar canal ${canal.idExterno}: ${errorMessage}`);
            yield database_1.default.canal.update({
                where: { idExterno: canal.idExterno },
                data: { sincronizadoNoJestor: false },
            });
            throw new Error(`Erro ao sincronizar canal ${canal.idExterno}`);
        }
    });
}
