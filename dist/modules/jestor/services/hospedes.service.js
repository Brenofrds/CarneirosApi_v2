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
exports.obterIdInternoHospedeNoJestor = obterIdInternoHospedeNoJestor;
exports.inserirHospedeNoJestor = inserirHospedeNoJestor;
exports.atualizarHospedeNoJestor = atualizarHospedeNoJestor;
exports.sincronizarHospede = sincronizarHospede;
const jestorClient_1 = __importDefault(require("../../../config/jestorClient"));
const models_1 = require("../../database/models");
const logger_1 = require("../../../utils/logger");
const database_1 = __importDefault(require("../../../config/database"));
const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const ENDPOINT_UPDATE = '/object/update';
const JESTOR_TB_HOSPEDE = '9ojuwm9mwun5ik__gkp21';
/**
 * Consulta o Jestor para verificar se o hóspede existe e, se sim, retorna o ID interno.
 * Tenta primeiro buscar por idExterno; se não encontrar, busca pelo nome.
 *
 * @param nome - Nome completo do hóspede.
 * @param idExterno - O ID externo do hóspede.
 * @returns - O ID interno do Jestor ou null se o hóspede não existir.
 */
function obterIdInternoHospedeNoJestor(nome, idExterno) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            // 1. Buscar pelo idExterno, se fornecido
            if (idExterno) {
                const responseId = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                    object_type: JESTOR_TB_HOSPEDE,
                    filters: [{ field: 'idexterno', value: idExterno, operator: '==' }],
                });
                const itemsId = (_b = (_a = responseId.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.items;
                if (Array.isArray(itemsId) && itemsId.length > 0) {
                    const idInterno = itemsId[0][`id_${JESTOR_TB_HOSPEDE}`];
                    return idInterno !== null && idInterno !== void 0 ? idInterno : null;
                }
            }
            // 2. Se não encontrou pelo idExterno, buscar pelo nome
            const responseNome = yield jestorClient_1.default.post(ENDPOINT_LIST, {
                object_type: JESTOR_TB_HOSPEDE,
                filters: [{ field: 'name', value: nome, operator: '==' }],
            });
            const itemsNome = (_d = (_c = responseNome.data) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.items;
            if (Array.isArray(itemsNome) && itemsNome.length > 0) {
                const idInterno = itemsNome[0][`id_${JESTOR_TB_HOSPEDE}`];
                return idInterno !== null && idInterno !== void 0 ? idInterno : null;
            }
            // 3. Não encontrou nenhum resultado
            return null;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao buscar hóspede no Jestor: ${errorMessage}`);
            throw new Error('Erro ao buscar hóspede no Jestor');
        }
    });
}
/**
 * Insere um hóspede no Jestor.
 * @param hospede - Dados do hóspede a serem inseridos.
 */
function inserirHospedeNoJestor(hospede, reservaIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = {
                id_bd_engnet: hospede.id,
                idexterno: hospede.idExterno,
                name: hospede.nomeCompleto,
                email: hospede.email,
                data_de_nascimento: hospede.dataDeNascimento,
                idade: hospede.idade,
                telefone: hospede.telefone,
                cpf: hospede.cpf,
                documento: hospede.documento,
                idreserva: hospede.reservaId,
                reserva: reservaIdJestor,
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_CREATE, {
                object_type: JESTOR_TB_HOSPEDE,
                data,
            });
            (0, logger_1.logDebug)('Hóspede', `✅ Hóspede ${hospede.nomeCompleto} inserido com sucesso no Jestor!`);
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao inserir hóspede ${hospede.nomeCompleto} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao inserir hóspede ${hospede.nomeCompleto} no Jestor`);
        }
    });
}
/**
 * Atualiza um hóspede existente no Jestor.
 * @param hospede - Dados do hóspede a serem atualizados.
 * @param idInterno - ID interno do Jestor necessário para a atualização.
 */
function atualizarHospedeNoJestor(hospede, idInterno, reservaIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const data = {
                object_type: JESTOR_TB_HOSPEDE,
                data: {
                    [`id_${JESTOR_TB_HOSPEDE}`]: idInterno,
                    id_bd_engnet: hospede.id,
                    idexterno: hospede.idExterno,
                    name: hospede.nomeCompleto,
                    email: hospede.email,
                    data_de_nascimento: hospede.dataDeNascimento,
                    idade: hospede.idade,
                    telefone: hospede.telefone,
                    cpf: hospede.cpf,
                    documento: hospede.documento,
                    idreserva: hospede.reservaId,
                    reserva: reservaIdJestor,
                }
            };
            const response = yield jestorClient_1.default.post(ENDPOINT_UPDATE, data);
            if ((_a = response.data) === null || _a === void 0 ? void 0 : _a.status) {
                (0, logger_1.logDebug)('Hóspede', `🔹 Hóspede ${hospede.nomeCompleto} atualizado com sucesso no Jestor!`);
            }
            else {
                (0, logger_1.logDebug)('Hóspede', `⚠️ Atualização do hóspede ${hospede.nomeCompleto} no Jestor retornou um status inesperado.`);
            }
            return response.data;
        }
        catch (error) {
            const errorMessage = ((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao atualizar hóspede ${hospede.nomeCompleto} no Jestor: ${errorMessage}`);
            throw new Error(`Erro ao atualizar hóspede ${hospede.nomeCompleto} no Jestor`);
        }
    });
}
/**
 * Sincroniza apenas UM hóspede específico com o Jestor.
 */
function sincronizarHospede(hospede, reservaIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 📥 Tenta obter o ID interno do hóspede no Jestor
            const idInterno = yield obterIdInternoHospedeNoJestor(hospede.nomeCompleto, hospede.idExterno);
            if (!idInterno) {
                yield inserirHospedeNoJestor(hospede, reservaIdJestor);
            }
            else {
                yield atualizarHospedeNoJestor(hospede, idInterno, reservaIdJestor);
            }
            // ✅ Marca como sincronizado apenas se não houver erro
            yield (0, models_1.atualizaCampoSincronizadoNoJestor)('hospede', hospede.idExterno || '');
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar hóspede ${hospede.nomeCompleto}: ${errorMessage}`);
            // ⚠️ Define o campo `sincronizadoNoJestor` como `false` para futuras tentativas
            yield database_1.default.hospede.update({
                where: { idExterno: hospede.idExterno || '' },
                data: { sincronizadoNoJestor: false },
            });
            // Lança o erro novamente para tratamento adicional
            throw new Error(`Erro ao sincronizar hóspede ${hospede.nomeCompleto}`);
        }
    });
}
