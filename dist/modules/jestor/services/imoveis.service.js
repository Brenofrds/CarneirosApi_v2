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
exports.obterIdInternoImovelNoJestor = obterIdInternoImovelNoJestor;
exports.inserirImovelNoJestor = inserirImovelNoJestor;
exports.atualizarImovelNoJestor = atualizarImovelNoJestor;
exports.sincronizarImovel = sincronizarImovel;
const jestorClient_1 = __importDefault(require("../../../config/jestorClient"));
const logger_1 = require("../../../utils/logger");
const database_1 = __importDefault(require("../../../config/database"));
const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_IMOVEL = 'e8c63980a87a858620f77';
/**
 * Consulta o Jestor para verificar se o imóvel existe e, se sim, retorna o ID interno.
 *
 * @param idExterno - O ID externo do imóvel.
 * @param sku - O SKU do imóvel.
 * @returns - O ID interno do Jestor ou null se o imóvel não existir.
 */
function obterIdInternoImovelNoJestor(idExterno, sku) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const response = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                object_type: JESTOR_TB_IMOVEL,
                filters: [
                    { field: 'id_externo', value: idExterno, operator: '==' },
                    { field: 'name', value: sku, operator: '==' },
                ],
            });
            const items = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.items;
            if (Array.isArray(items) && items.length > 0) {
                const idInterno = items[0][`id_${JESTOR_TB_IMOVEL}`];
                return idInterno !== null && idInterno !== void 0 ? idInterno : null;
            }
            return null;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao buscar imóvel no Jestor: ${errorMessage}`);
            throw new Error('Erro ao buscar imóvel no Jestor');
        }
    });
}
/**
 * Insere um imóvel no Jestor.
 * @param imovel - Dados do imóvel a serem inseridos.
 */
function inserirImovelNoJestor(imovel, condominioIdJestor, proprietarioIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
                id_bd_engnet: imovel.id,
                id_externo: imovel.idExterno,
                id_stays: imovel.idStays,
                name: imovel.sku,
                status: imovel.status,
                idcondominiostays: imovel.idCondominioStays || null,
                regiao_1: imovel.regiao || null,
                proprietario_id: imovel.proprietarioId || null, // ✅ Agora enviamos também o ID do proprietário
                condominio: condominioIdJestor || null,
                proprietario: proprietarioIdJestor || null,
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_CREATE, {
                object_type: JESTOR_TB_IMOVEL,
                data,
            });
            (0, logger_1.logDebug)('Imóvel', `✅ Imóvel ${imovel.idExterno} inserido com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao inserir imóvel ${imovel.idExterno} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao inserir imóvel ${imovel.idExterno} no Jestor`);
        }
    });
}
/**
 * Atualiza um imóvel existente no Jestor.
 * @param imovel - Dados do imóvel a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
function atualizarImovelNoJestor(imovel, idInterno, condominioIdJestor, proprietarioIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const data = {
                object_type: JESTOR_TB_IMOVEL,
                data: {
                    [`id_${JESTOR_TB_IMOVEL}`]: idInterno, // ✅ Campo obrigatório do ID interno
                    id_bd_engnet: imovel.id,
                    id_externo: imovel.idExterno,
                    id_stays: imovel.idStays,
                    name: imovel.sku,
                    status: imovel.status,
                    idcondominiostays: imovel.idCondominioStays || null,
                    regiao_1: imovel.regiao || null,
                    proprietario_id: imovel.proprietarioId || null,
                    condominio: condominioIdJestor || null,
                    proprietario: proprietarioIdJestor || null,
                }
            };
            // 🚀 Envia a solicitação de atualização ao Jestor
            const response = yield jestorClient_1.default.post(ENDPOINT_UPDATE, data);
            // ✅ Log simplificado apenas com o status e o ID do imóvel atualizado
            if ((_a = response.data) === null || _a === void 0 ? void 0 : _a.status) {
                (0, logger_1.logDebug)('Imóvel', `🔹 Imóvel ${imovel.idExterno} atualizado com sucesso no Jestor!`);
            }
            else {
                (0, logger_1.logDebug)('Imóvel', `⚠️ Atualização do imóvel ${imovel.idExterno} no Jestor retornou um status inesperado.`);
            }
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao atualizar imóvel ${imovel.idExterno} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao atualizar imóvel ${imovel.idExterno} no Jestor`);
        }
    });
}
/**
 * Sincroniza apenas UM imóvel específico com o Jestor.
 */
function sincronizarImovel(imovel, condominioIdJestor, proprietarioIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // 🔍 Usa o jestorId do canal (caso já tenha) para evitar nova consulta
            let idInterno = imovel.jestorId || null;
            // 🔍 Se ainda não temos o ID interno salvo, buscamos no Jestor
            if (!idInterno) {
                idInterno = yield obterIdInternoImovelNoJestor(imovel.idExterno, imovel.sku);
            }
            if (!idInterno) {
                const response = yield inserirImovelNoJestor(imovel, condominioIdJestor, proprietarioIdJestor);
                idInterno = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a[`id_${JESTOR_TB_IMOVEL}`];
            }
            else {
                yield atualizarImovelNoJestor(imovel, idInterno.toString(), condominioIdJestor, proprietarioIdJestor);
            }
            return idInterno;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar imóvel ${imovel.idExterno}: ${errorMessage}`);
            // ⚠️ Define o campo `sincronizadoNoJestor` como `false` para futuras tentativas
            yield database_1.default.imovel.update({
                where: { idExterno: imovel.idExterno },
                data: { sincronizadoNoJestor: false },
            });
            // Lança o erro novamente para tratamento adicional
            throw new Error(`Erro ao sincronizar imóvel ${imovel.idExterno}`);
        }
    });
}
