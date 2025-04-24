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
exports.obterIdErroNoJestor = obterIdErroNoJestor;
exports.inserirErroNoJestor = inserirErroNoJestor;
exports.atualizarErroNoJestor = atualizarErroNoJestor;
exports.sincronizarErroJestor = sincronizarErroJestor;
const jestorClient_1 = __importDefault(require("../../../config/jestorClient"));
const database_1 = __importDefault(require("../../../config/database"));
const logger_1 = require("../../../utils/logger");
const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_ERRO_STAYS = 'org2zt5na9n4bymuqqn6k';
/**
 * Obtém o ID interno do erro no Jestor
 *
 * @param idApi - O ID interno do erro no banco de dados.
 * @returns - O ID interno do Jestor ou null se não existir.
 */
function obterIdErroNoJestor(idApi) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const response = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                object_type: JESTOR_TB_ERRO_STAYS,
                filters: [{ field: 'idApi', value: idApi, operator: '==' }],
            });
            const items = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.items;
            if (Array.isArray(items) && items.length > 0) {
                return (_c = items[0][`id_${JESTOR_TB_ERRO_STAYS}`]) !== null && _c !== void 0 ? _c : null;
            }
            return null;
        }
        catch (error) {
            (0, logger_1.logDebug)('Erro', `❌ Erro ao buscar erro no Jestor: ${error.message}`);
            throw new Error('Erro ao buscar erro no Jestor');
        }
    });
}
/**
 * Insere um erro de sincronização no Jestor.
 *
 * @param erro - Dados do erro a serem inseridos.
 */
function inserirErroNoJestor(erro) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
                idApi: erro.id,
                nometabelanaapi: erro.tabela,
                idregistronaapi: erro.registroId,
                erro: erro.erro,
                tentativas: erro.tentativas,
                dataerro: erro.data,
                errohora: erro.hora,
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_CREATE, {
                object_type: JESTOR_TB_ERRO_STAYS,
                data,
            });
            (0, logger_1.logDebug)('ErroJestor', `✅ Erro ${erro.id} inserido com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao inserir erro ${erro.id} no Jestor: ${errorMessage}`);
            // Salvar erro localmente SEM tentar reenviar automaticamente
            yield database_1.default.erroSincronizacaoJestor.update({
                where: { id: erro.id },
                data: { sincronizadoNoJestor: false },
            });
            throw new Error(`Erro ao inserir erro ${erro.id} no Jestor`);
        }
    });
}
/**
 * Atualiza um erro de sincronização no Jestor.
 *
 * @param erro - Dados do erro a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
function atualizarErroNoJestor(erro, idInterno) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
                object_type: JESTOR_TB_ERRO_STAYS,
                data: {
                    [`id_${JESTOR_TB_ERRO_STAYS}`]: idInterno,
                    idApi: erro.id,
                    nometabelanaapi: erro.tabela,
                    idregistronaapi: erro.registroId,
                    erro: erro.erro,
                    tentativas: erro.tentativas,
                    dataerro: erro.data,
                    errohora: erro.hora,
                },
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_UPDATE, data);
            (0, logger_1.logDebug)('ErroJestor', `🔹 Erro ${erro.id} atualizado com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao atualizar erro ${erro.id} no Jestor: ${errorMessage}`);
            // Salvar erro localmente SEM tentar reenviá-lo automaticamente
            yield database_1.default.erroSincronizacaoJestor.update({
                where: { id: erro.id },
                data: { sincronizadoNoJestor: false },
            });
            throw new Error(`Erro ao atualizar erro ${erro.id} no Jestor`);
        }
    });
}
/**
 * Sincroniza um erro de sincronização específico com o Jestor.
 *
 * @param erro - Dados do erro a ser sincronizado.
 */
function sincronizarErroJestor(erro) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 📥 Obtém o ID interno do erro no Jestor
            const idInterno = yield obterIdErroNoJestor(erro.id);
            if (!idInterno) {
                yield inserirErroNoJestor(erro);
            }
            else {
                yield atualizarErroNoJestor(erro, idInterno);
            }
            // ✅ Atualiza o status de sincronização no banco de dados
            yield database_1.default.erroSincronizacaoStays.update({
                where: { id: erro.id },
                data: { sincronizadoNoJestor: true },
            });
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar erro ${erro.id}: ${errorMessage}`);
            // ⚠️ Define o campo `sincronizadoNoJestor` como `false` para futuras tentativas
            yield database_1.default.erroSincronizacaoStays.update({
                where: { id: erro.id },
                data: { sincronizadoNoJestor: false },
            });
            throw new Error(`Erro ao sincronizar erro ${erro.id}`);
        }
    });
}
