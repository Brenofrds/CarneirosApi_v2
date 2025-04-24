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
exports.processarListingWebhook = exports.processarBloqueioWebhook = exports.processWebhookData = void 0;
const fetchService_1 = require("./services/fetchService");
const transformService_1 = require("./services/transformService");
const saveService_1 = require("./services/saveService");
const database_1 = __importDefault(require("../../config/database")); // Importa o cliente Prisma
const logger_1 = require("../../utils/logger");
const reservas_service_1 = require("../jestor/services/reservas.service");
/**
 * Processa os dados recebidos pelo webhook
 * @param body - Corpo da requisição do webhook
 */
const processWebhookData = (body) => __awaiter(void 0, void 0, void 0, function* () {
    const { action, payload } = body;
    // 🚨 Log apenas em caso de erro de dados
    if (!action || !payload) {
        (0, logger_1.logDebug)('Erro', "Dados inválidos: 'action' ou 'payload' ausentes.");
        throw new Error("Dados inválidos: 'action' ou 'payload' ausentes.");
    }
    try {
        switch (action) {
            case "reservation.created":
            case "reservation.modified":
                (0, logger_1.logDebug)('Reserva', `Processando ${action} para o ID ${payload._id}`);
                // ✅ Lista de tipos de reserva que devem ser tratados como bloqueios
                const tiposBloqueio = ["blocked", "maintenance"];
                // 🔁 Se o tipo da reserva estiver na lista de bloqueios, processa como bloqueio
                // Caso contrário, processa como uma reserva normal
                return tiposBloqueio.includes(payload.type)
                    ? yield (0, exports.processarBloqueioWebhook)(payload)
                    : yield processarReservaWebhook(payload);
            case "reservation.canceled":
                (0, logger_1.logDebug)('Reserva', `Cancelando reserva ID ${payload._id}`);
                return yield processarAtualizacaoStatus(payload, "Cancelada");
            case "reservation.deleted":
                (0, logger_1.logDebug)('Reserva', `Deletando reserva ID ${payload._id}`);
                return yield processarAtualizacaoStatus(payload, "Deletada");
            case "listing.modified":
            case "listing.created":
                (0, logger_1.logDebug)('Imóvel', `Processando ${action} para o ID ${payload._id}`);
                return yield (0, exports.processarListingWebhook)(payload);
            default:
                (0, logger_1.logDebug)('Erro', `Ação desconhecida recebida: ${action}`);
                throw new Error(`Ação desconhecida: ${action}`);
        }
    }
    catch (error) {
        (0, logger_1.logDebug)('Erro', `Erro ao processar ação ${action}`, error.message);
        throw new Error(`Erro ao processar ação ${action}: ${error.message}`);
    }
});
exports.processWebhookData = processWebhookData;
const processarReservaWebhook = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        // 🔹 Transformar os dados da reserva recebidos no formato correto para salvar
        const reservaData = (0, transformService_1.transformReserva)(payload);
        const agenteData = (0, transformService_1.transformAgente)(payload.agent);
        const canalData = (0, transformService_1.transformCanal)(payload.partner);
        let agenteId = null;
        let agenteIdJestor = null;
        if (agenteData) {
            const resultadoAgente = yield (0, saveService_1.salvarAgente)(agenteData);
            agenteId = resultadoAgente.id;
            agenteIdJestor = resultadoAgente.jestorId;
        }
        // 🔹 Criar/Atualizar Canal e obter ID do banco
        let canalId = null;
        let canalIdJestor = null;
        if (canalData) {
            const resultadoCanal = yield (0, saveService_1.salvarCanal)(canalData);
            canalId = resultadoCanal.id;
            canalIdJestor = resultadoCanal.jestorId;
        }
        else {
            const canalReservaDireta = yield (0, saveService_1.obterOuCriarCanalReservaDireta)();
            canalId = canalReservaDireta.id;
            canalIdJestor = canalReservaDireta.jestorId;
        }
        // 🔹 Buscar e salvar Imóvel e Proprietário primeiro
        let imovelId = null;
        let imovelSku = null;
        let imovelIdJestor = null;
        let condominioSku = null;
        let condominioRegiao = null;
        let condominioIdJestor = null;
        let condominioTitulo = null;
        if (payload._idlisting) {
            const { imovel, proprietario } = yield (0, fetchService_1.fetchImovelDetalhado)(payload._idlisting);
            if (imovel) {
                // 🔹 Se o imóvel tiver um ID de condomínio, buscar e salvar o condomínio de forma síncrona (aguardando o resultado)
                if (imovel._idproperty) {
                    const condominioDetalhado = yield (0, fetchService_1.fetchCondominioDetalhado)(imovel._idproperty);
                    if (condominioDetalhado) {
                        const condominioSalvo = yield (0, saveService_1.salvarCondominio)(condominioDetalhado);
                        condominioSku = condominioSalvo.sku;
                        condominioRegiao = condominioSalvo.regiao;
                        condominioTitulo = condominioSalvo.titulo;
                        condominioIdJestor = condominioSalvo.jestorId;
                    }
                }
                imovel.owner = proprietario || undefined;
                // 🔹 Salvar o imóvel no banco de dados
                const imovelSalvo = yield (0, saveService_1.salvarImovel)(imovel, condominioIdJestor !== null && condominioIdJestor !== void 0 ? condominioIdJestor : undefined);
                imovelId = imovelSalvo.id;
                imovelSku = imovelSalvo.sku;
                imovelIdJestor = imovelSalvo.jestorId;
            }
        }
        // 🔹 Atualiza a reserva com os IDs corretos
        reservaData.imovelId = imovelId;
        reservaData.imovelOficialSku = imovelSku || '';
        reservaData.imovelIdJestor = imovelIdJestor;
        reservaData.condominio = condominioSku || '';
        reservaData.regiao = condominioRegiao || '';
        reservaData.agenteId = agenteId;
        reservaData.agenteIdJestor = agenteIdJestor;
        reservaData.canalId = canalId;
        reservaData.canalIdJestor = canalIdJestor;
        // 🔹 Salvar Reserva no banco com os IDs corretos
        const { id: reservaId, jestorId: reservaIdJestor } = yield (0, saveService_1.salvarReserva)(reservaData);
        // 🔹 Salva Hóspede (depois de salvar a reserva!)
        if (payload._idclient) {
            const hospedeDetalhado = yield (0, fetchService_1.fetchHospedeDetalhado)(payload._idclient);
            if (hospedeDetalhado) {
                yield (0, saveService_1.salvarHospede)(hospedeDetalhado, reservaId, reservaIdJestor !== null && reservaIdJestor !== void 0 ? reservaIdJestor : undefined);
            }
        }
        // 🔹 Salva Taxas da Reserva
        const taxasReservas = ((_c = (_b = (_a = payload.price) === null || _a === void 0 ? void 0 : _a.extrasDetails) === null || _b === void 0 ? void 0 : _b.fees) === null || _c === void 0 ? void 0 : _c.map((taxa) => {
            var _a;
            return ({
                reservaId: reservaId,
                name: ((_a = taxa.name) === null || _a === void 0 ? void 0 : _a.trim()) || "Taxa Desconhecida",
                valor: taxa._f_val,
            });
        })) || [];
        yield (0, saveService_1.salvarTaxasReserva)(taxasReservas, reservaIdJestor !== null && reservaIdJestor !== void 0 ? reservaIdJestor : undefined);
        (0, logger_1.logDebug)('Reserva', `Reserva ${reservaData.localizador} processada com sucesso!`);
        return reservaId;
    }
    catch (error) {
        (0, logger_1.logDebug)('Erro', `Erro ao processar reserva ${payload._id}: ${error.message}`);
        throw new Error(`Erro ao processar reserva ${payload._id}`);
    }
});
/**
 * Processa notificações de bloqueios (reservation.created ou reservation.modified com type: "blocked").
 *
 * @param payload - Objeto contendo os dados da reserva bloqueada recebidos do webhook da Stays.
 */
const processarBloqueioWebhook = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, logger_1.logDebug)("Bloqueio", `🔹 Processando webhook para bloqueio ${payload._id}`);
        // 🔹 Transformar os dados do payload no formato correto
        const bloqueioData = (0, transformService_1.transformBloqueio)(payload);
        let imovelId = null;
        let imovelIdJestor = null;
        let condominioIdJestor = null;
        if (payload._idlisting) {
            const { imovel, proprietario } = yield (0, fetchService_1.fetchImovelDetalhado)(payload._idlisting);
            if (imovel) {
                // 🔹 Se tiver ID de condomínio, buscar e salvar antes do imóvel
                if (imovel._idproperty) {
                    const condominioDetalhado = yield (0, fetchService_1.fetchCondominioDetalhado)(imovel._idproperty);
                    if (condominioDetalhado) {
                        const condominioSalvo = yield (0, saveService_1.salvarCondominio)(condominioDetalhado);
                        condominioIdJestor = condominioSalvo.jestorId;
                    }
                }
                // 🔹 Atribui o proprietário ao imóvel antes de salvar
                imovel.owner = proprietario || undefined;
                const imovelSalvo = yield (0, saveService_1.salvarImovel)(imovel, condominioIdJestor !== null && condominioIdJestor !== void 0 ? condominioIdJestor : undefined);
                imovelId = imovelSalvo.id;
                imovelIdJestor = imovelSalvo.jestorId;
                // 🔹 Atualiza os dados do bloqueio com o ID do imóvel
                bloqueioData.imovelId = imovelId;
                bloqueioData.imovelIdJestor = imovelIdJestor !== null && imovelIdJestor !== void 0 ? imovelIdJestor : null;
            }
            else {
                (0, logger_1.logDebug)("Aviso", `⚠️ Imóvel ${payload._idlisting} não encontrado na API da Stays.`);
            }
        }
        // 🔹 Salvar o bloqueio com dados completos
        const bloqueioSalvo = yield (0, saveService_1.salvarBloqueio)(bloqueioData);
        (0, logger_1.logDebug)("Bloqueio", `✅ Bloqueio ${bloqueioSalvo.id} processado com sucesso!`);
        return bloqueioSalvo;
    }
    catch (error) {
        (0, logger_1.logDebug)("Erro", `❌ Erro ao processar bloqueio ${payload._id}: ${error.message}`);
        throw new Error(`Erro ao processar bloqueio ${payload._id}`);
    }
});
exports.processarBloqueioWebhook = processarBloqueioWebhook;
/**
 * Processa notificações de cancelamento ou exclusão de reservas.
 * Se a reserva já existir, apenas atualiza o status no banco de dados e sincroniza no Jestor.
 * Se a reserva não existir e o status for "Cancelada", busca detalhes da reserva na API e cria a reserva.
 *
 * @param payload - Objeto contendo os dados da reserva.
 * @param novoStatus - Novo status a ser atribuído ("Cancelada" ou "Deletada").
 */
const processarAtualizacaoStatus = (payload, novoStatus) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        (0, logger_1.logDebug)("Reserva", `Processando status "${novoStatus}" para reserva ${payload._id}`);
        // 🔹 Tenta localizar a reserva no banco de dados
        let reservaExistente = yield database_1.default.reserva.findUnique({ where: { idExterno: payload._id } });
        // ✅ Se a reserva existir, apenas atualiza o status no banco e sincroniza no Jestor
        if (reservaExistente) {
            console.log(`🔄 Atualizando status da reserva existente para "${novoStatus}"...`);
            // 🔄 Atualiza o status da reserva no banco
            const reservaAtualizada = yield database_1.default.reserva.update({
                where: { idExterno: payload._id },
                data: { status: novoStatus, sincronizadoNoJestor: false },
            });
            console.log(`✅ Reserva ${payload._id} atualizada para "${novoStatus}".`);
            // 🔄 Converte para o formato esperado por `sincronizarReserva`
            const reservaParaSincronizar = {
                id: reservaAtualizada.id,
                localizador: reservaAtualizada.localizador,
                idExterno: reservaAtualizada.idExterno,
                dataDaCriacao: reservaAtualizada.dataDaCriacao,
                checkIn: reservaAtualizada.checkIn,
                horaCheckIn: reservaAtualizada.horaCheckIn,
                checkOut: reservaAtualizada.checkOut,
                horaCheckOut: reservaAtualizada.horaCheckOut,
                quantidadeHospedes: reservaAtualizada.quantidadeHospedes,
                quantidadeAdultos: reservaAtualizada.quantidadeAdultos,
                quantidadeCriancas: reservaAtualizada.quantidadeCriancas,
                quantidadeInfantil: reservaAtualizada.quantidadeInfantil,
                moeda: reservaAtualizada.moeda,
                valorTotal: reservaAtualizada.valorTotal,
                totalPago: reservaAtualizada.totalPago,
                pendenteQuitacao: reservaAtualizada.pendenteQuitacao,
                totalTaxasExtras: reservaAtualizada.totalTaxasExtras,
                quantidadeDiarias: reservaAtualizada.quantidadeDiarias,
                partnerCode: reservaAtualizada.partnerCode || null,
                linkStays: reservaAtualizada.linkStays,
                idImovelStays: reservaAtualizada.idImovelStays,
                origem: reservaAtualizada.origem,
                status: reservaAtualizada.status,
                condominio: reservaAtualizada.condominio,
                regiao: reservaAtualizada.regiao,
                imovelOficialSku: reservaAtualizada.imovelOficialSku,
                observacao: reservaAtualizada.observacao || null,
                imovelId: (_a = reservaAtualizada.imovelId) !== null && _a !== void 0 ? _a : null,
                canalId: (_b = reservaAtualizada.canalId) !== null && _b !== void 0 ? _b : null,
                jestorId: (_c = reservaAtualizada.jestorId) !== null && _c !== void 0 ? _c : null,
            };
            yield (0, reservas_service_1.sincronizarReserva)(reservaParaSincronizar);
            (0, logger_1.logDebug)("Reserva", `Reserva ${payload._id} atualizada para "${novoStatus}" e sincronizada com sucesso!`);
            return reservaAtualizada;
        }
        // 🔴 Se a reserva não existir e o status for "Cancelada", buscamos detalhes na API Stays e processamos a reserva
        if (novoStatus === "Cancelada") {
            console.warn(`⚠️ Reserva ${payload._id} não encontrada no banco. Buscando detalhes na API Stays...`);
            // 📡 Buscar detalhes da reserva na API Stays
            const detalhesReserva = yield (0, fetchService_1.fetchReservaDetalhada)(payload._id);
            if (!detalhesReserva) {
                throw new Error(`Erro: Detalhes da reserva ${payload._id} não encontrados na API.`);
            }
            // 🔄 Processar a reserva usando a função principal que já salva no banco e no Jestor
            return yield processarReservaWebhook(detalhesReserva);
        }
        // 🚫 Se o status for "Deletada" e a reserva não existir, **não faz nada** (a reserva foi realmente deletada)
        if (novoStatus === "Deletada") {
            (0, logger_1.logDebug)("Reserva", `Reserva ${payload._id} não encontrada no banco e não pode ser recriada.`);
        }
    }
    catch (error) {
        (0, logger_1.logDebug)("Erro", `Erro ao processar status "${novoStatus}" para reserva ${payload._id}: ${error.message}`);
        throw new Error(`Erro ao atualizar status para "${novoStatus}".`);
    }
});
/**
 * Processa notificações de criação ou modificação de listagens de imóveis.
 *
 * @param payload - Objeto contendo os dados da listagem recebidos do webhook da Stays.
 */
const processarListingWebhook = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let imovelId = null;
        let condominioIdJestor = null;
        if (payload._id) {
            // 🔹 Busca detalhes do imóvel e do proprietário na API da Stays
            const { imovel, proprietario } = yield (0, fetchService_1.fetchImovelDetalhado)(payload._id);
            if (imovel) {
                // 🔹 Se o imóvel tiver um ID de condomínio, buscar e salvar o condomínio de forma síncrona
                if (imovel._idproperty) {
                    const condominioDetalhado = yield (0, fetchService_1.fetchCondominioDetalhado)(imovel._idproperty);
                    if (condominioDetalhado) {
                        const condominioSalvo = yield (0, saveService_1.salvarCondominio)(condominioDetalhado);
                        condominioIdJestor = condominioSalvo.jestorId;
                    }
                }
                // 🔹 Atribui o proprietário ao objeto do imóvel
                imovel.owner = proprietario || undefined;
                // 🔹 Salvar o imóvel no banco de dados (inclui salvarProprietario internamente)
                const imovelSalvo = yield (0, saveService_1.salvarImovel)(imovel, condominioIdJestor !== null && condominioIdJestor !== void 0 ? condominioIdJestor : undefined);
                imovelId = imovelSalvo.id;
            }
        }
        (0, logger_1.logDebug)('Imovel', `🏠 Imóvel ${payload._id} processado com sucesso!`);
        return imovelId;
    }
    catch (error) {
        (0, logger_1.logDebug)('Erro', `❌ Erro ao processar listagem de imóvel ${payload._id}: ${error.message}`);
        throw new Error(`Erro ao processar listagem de imóvel ${payload._id}`);
    }
});
exports.processarListingWebhook = processarListingWebhook;
