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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.salvarReserva = salvarReserva;
exports.salvarImovel = salvarImovel;
exports.salvarHospede = salvarHospede;
exports.salvarTaxasReserva = salvarTaxasReserva;
exports.salvarCondominio = salvarCondominio;
exports.salvarProprietario = salvarProprietario;
exports.salvarBloqueio = salvarBloqueio;
exports.salvarCanal = salvarCanal;
exports.obterOuCriarCanalReservaDireta = obterOuCriarCanalReservaDireta;
exports.salvarAgente = salvarAgente;
const database_1 = __importDefault(require("../../../config/database"));
const erro_service_1 = require("../../database/erro.service"); // Importa a função que salva erros
const reservas_service_1 = require("../../jestor/services/reservas.service");
const imoveis_service_1 = require("../../jestor/services/imoveis.service");
const hospedes_service_1 = require("../../jestor/services/hospedes.service");
const condominios_service_1 = require("../../jestor/services/condominios.service");
const proprietarios_service_1 = require("../../jestor/services/proprietarios.service");
const taxasReservas_service_1 = require("../../jestor/services/taxasReservas.service");
const bloqueios_service_1 = require("../../jestor/services/bloqueios.service");
const canais_service_1 = require("../../jestor/services/canais.service");
const agentes_service_1 = require("../../jestor/services/agentes.service");
const logger_1 = require("../../../utils/logger");
function salvarReserva(reserva) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const { agenteIdJestor, canalIdJestor, imovelIdJestor } = reserva, dadosParaSalvar = __rest(reserva, ["agenteIdJestor", "canalIdJestor", "imovelIdJestor"]);
        // 🔹 Busca a reserva existente no banco de dados pelo localizador
        const reservaExistente = yield database_1.default.reserva.findUnique({
            where: { localizador: reserva.localizador },
        });
        // 🔍 Normaliza valores antes da comparação
        const normalizarTexto = (texto) => (texto === null || texto === void 0 ? void 0 : texto.trim().toLowerCase()) || '';
        const normalizarNumero = (num) => (num === undefined ? null : num);
        let jestorIdAtualizado = (_a = reservaExistente === null || reservaExistente === void 0 ? void 0 : reservaExistente.jestorId) !== null && _a !== void 0 ? _a : null;
        // 🔍 Verifica se há diferenças
        const precisaAtualizar = !reservaExistente ||
            normalizarTexto(reservaExistente.idExterno) !== normalizarTexto(reserva.idExterno) ||
            reservaExistente.dataDaCriacao !== reserva.dataDaCriacao ||
            reservaExistente.checkIn !== reserva.checkIn ||
            reservaExistente.horaCheckIn !== reserva.horaCheckIn ||
            reservaExistente.checkOut !== reserva.checkOut ||
            reservaExistente.horaCheckOut !== reserva.horaCheckOut ||
            reservaExistente.quantidadeHospedes !== reserva.quantidadeHospedes ||
            reservaExistente.quantidadeAdultos !== reserva.quantidadeAdultos ||
            reservaExistente.quantidadeCriancas !== reserva.quantidadeCriancas ||
            reservaExistente.quantidadeInfantil !== reserva.quantidadeInfantil ||
            normalizarTexto(reservaExistente.moeda) !== normalizarTexto(reserva.moeda) ||
            reservaExistente.valorTotal !== reserva.valorTotal ||
            reservaExistente.totalPago !== reserva.totalPago ||
            reservaExistente.pendenteQuitacao !== reserva.pendenteQuitacao ||
            reservaExistente.totalTaxasExtras !== reserva.totalTaxasExtras ||
            reservaExistente.quantidadeDiarias !== reserva.quantidadeDiarias ||
            normalizarTexto(reservaExistente.partnerCode) !== normalizarTexto(reserva.partnerCode) ||
            normalizarTexto(reservaExistente.linkStays) !== normalizarTexto(reserva.linkStays) ||
            normalizarTexto(reservaExistente.idImovelStays) !== normalizarTexto(reserva.idImovelStays) ||
            normalizarNumero(reservaExistente.imovelId) !== normalizarNumero(reserva.imovelId) ||
            normalizarNumero(reservaExistente.imovelIdJestor) !== normalizarNumero(imovelIdJestor) ||
            normalizarNumero(reservaExistente.canalId) !== normalizarNumero(reserva.canalId) ||
            normalizarNumero(reservaExistente.agenteId) !== normalizarNumero(reserva.agenteId) ||
            normalizarTexto(reservaExistente.origem) !== normalizarTexto(reserva.origem) ||
            normalizarTexto(reservaExistente.status) !== normalizarTexto(reserva.status) ||
            normalizarTexto(reservaExistente.condominio) !== normalizarTexto(reserva.condominio) ||
            normalizarTexto(reservaExistente.regiao) !== normalizarTexto(reserva.regiao) ||
            normalizarTexto(reservaExistente.imovelOficialSku) !== normalizarTexto(reserva.imovelOficialSku) ||
            normalizarTexto(reservaExistente.observacao) !== normalizarTexto(reserva.observacao) ||
            reservaExistente.jestorId === null || reservaExistente.jestorId === undefined;
        if (!precisaAtualizar) {
            (0, logger_1.logDebug)('Reserva', `Nenhuma mudança detectada para reserva ${reserva.idExterno}. Nenhuma atualização no banco foi realizada.`);
            (0, logger_1.logDebug)('Reserva', `Status de sincronização atual no banco: ${reservaExistente === null || reservaExistente === void 0 ? void 0 : reservaExistente.sincronizadoNoJestor}`);
            if (reservaExistente && !reservaExistente.sincronizadoNoJestor) {
                try {
                    (0, logger_1.logDebug)('Reserva', `🔄 Sincronizando reserva ${reserva.idExterno} no Jestor.`);
                    jestorIdAtualizado = yield (0, reservas_service_1.sincronizarReserva)(reservaExistente, agenteIdJestor !== null && agenteIdJestor !== void 0 ? agenteIdJestor : undefined, canalIdJestor !== null && canalIdJestor !== void 0 ? canalIdJestor : undefined, imovelIdJestor !== null && imovelIdJestor !== void 0 ? imovelIdJestor : undefined);
                    // 👇 Atualiza o campo jestorId após sincronização
                    if (jestorIdAtualizado) {
                        yield database_1.default.reserva.update({
                            where: { id: reservaExistente.id },
                            data: {
                                jestorId: jestorIdAtualizado,
                                sincronizadoNoJestor: true,
                            },
                        });
                    }
                }
                catch (error) {
                    const errorMessage = error.message || 'Erro desconhecido';
                    (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar reserva ${reserva.idExterno} com Jestor: ${errorMessage}`);
                    yield (0, erro_service_1.registrarErroJestor)('reserva', reservaExistente.id.toString(), errorMessage);
                }
            }
            return {
                id: reservaExistente.id,
                jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : null,
            };
        }
        // ✅ Atualiza ou cria a reserva no banco
        (0, logger_1.logDebug)('Reserva', `🚨 Atualizando reserva ${reserva.idExterno} no banco.`);
        const reservaSalva = yield database_1.default.reserva.upsert({
            where: { localizador: reserva.localizador },
            update: Object.assign(Object.assign({}, dadosParaSalvar), { imovelId: (_b = reserva.imovelId) !== null && _b !== void 0 ? _b : null, agenteId: reserva.agenteId, canalId: reserva.canalId, imovelIdJestor: imovelIdJestor !== null && imovelIdJestor !== void 0 ? imovelIdJestor : null, sincronizadoNoJestor: false }),
            create: Object.assign(Object.assign({}, dadosParaSalvar), { imovelId: (_c = reserva.imovelId) !== null && _c !== void 0 ? _c : null, agenteId: reserva.agenteId, canalId: reserva.canalId, imovelIdJestor: imovelIdJestor !== null && imovelIdJestor !== void 0 ? imovelIdJestor : null, sincronizadoNoJestor: false }),
        });
        try {
            jestorIdAtualizado = yield (0, reservas_service_1.sincronizarReserva)(reservaSalva, agenteIdJestor !== null && agenteIdJestor !== void 0 ? agenteIdJestor : undefined, canalIdJestor !== null && canalIdJestor !== void 0 ? canalIdJestor : undefined, imovelIdJestor !== null && imovelIdJestor !== void 0 ? imovelIdJestor : undefined);
            // 👇 Atualiza o campo jestorId após sincronização
            if (jestorIdAtualizado) {
                yield database_1.default.reserva.update({
                    where: { id: reservaSalva.id },
                    data: {
                        jestorId: jestorIdAtualizado,
                        sincronizadoNoJestor: true,
                    },
                });
            }
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar reserva ${reservaSalva.idExterno} com Jestor: ${errorMessage}`);
            yield (0, erro_service_1.registrarErroJestor)('reserva', reservaSalva.id.toString(), errorMessage);
        }
        return {
            id: reservaSalva.id,
            jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : null,
        };
    });
}
function salvarImovel(imovel, condominioIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const imovelExistente = yield database_1.default.imovel.findUnique({
            where: { idExterno: imovel._id },
        });
        let proprietarioId = null;
        let proprietarioIdJestor = null;
        if (imovel.owner) {
            const proprietarioSalvo = yield salvarProprietario(imovel.owner.nome, imovel.owner.telefone);
            proprietarioId = proprietarioSalvo.id;
            proprietarioIdJestor = proprietarioSalvo.jestorId;
        }
        let jestorIdAtualizado = (_a = imovelExistente === null || imovelExistente === void 0 ? void 0 : imovelExistente.jestorId) !== null && _a !== void 0 ? _a : null;
        const normalizarTexto = (texto) => (texto === null || texto === void 0 ? void 0 : texto.trim().toLowerCase()) || '';
        const normalizarNumero = (num) => (num === undefined ? null : num);
        const precisaAtualizar = !imovelExistente ||
            normalizarTexto(imovelExistente.idStays) !== normalizarTexto(imovel.id) ||
            normalizarTexto(imovelExistente.sku) !== normalizarTexto(imovel.internalName) ||
            normalizarTexto(imovelExistente.status) !== normalizarTexto(imovel.status) ||
            normalizarTexto(imovelExistente.idCondominioStays) !== normalizarTexto(imovel._idproperty) ||
            normalizarTexto(imovelExistente.regiao) !== normalizarTexto(imovel.regiao) ||
            normalizarNumero(imovelExistente.proprietarioId) !== normalizarNumero(proprietarioId) ||
            normalizarNumero(imovelExistente.condominioIdJestor) !== normalizarNumero(condominioIdJestor) ||
            imovelExistente.jestorId === null || imovelExistente.jestorId === undefined;
        if (!precisaAtualizar) {
            (0, logger_1.logDebug)('Imovel', `Nenhuma mudança detectada para imóvel ${imovel._id}. Nenhuma atualização no banco foi realizada.`);
            if (imovelExistente && !imovelExistente.sincronizadoNoJestor) {
                try {
                    (0, logger_1.logDebug)('Imovel', `🔄 Sincronizando imóvel ${imovel._id} no Jestor.`);
                    jestorIdAtualizado = yield (0, imoveis_service_1.sincronizarImovel)(imovelExistente, condominioIdJestor, proprietarioIdJestor !== null && proprietarioIdJestor !== void 0 ? proprietarioIdJestor : undefined);
                    if (jestorIdAtualizado) {
                        yield database_1.default.imovel.update({
                            where: { id: imovelExistente.id },
                            data: {
                                jestorId: jestorIdAtualizado,
                                condominioIdJestor: condominioIdJestor !== null && condominioIdJestor !== void 0 ? condominioIdJestor : null,
                                sincronizadoNoJestor: true,
                            },
                        });
                    }
                }
                catch (error) {
                    const errorMessage = error.message || 'Erro desconhecido';
                    (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar imóvel ${imovel._id} com Jestor: ${errorMessage}`);
                    yield (0, erro_service_1.registrarErroJestor)('imovel', imovelExistente.id.toString(), errorMessage);
                }
            }
            return {
                id: imovelExistente.id,
                sku: (_b = imovelExistente.sku) !== null && _b !== void 0 ? _b : null,
                jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : null,
            };
        }
        (0, logger_1.logDebug)('Imovel', `🚨 Atualizando imóvel ${imovel._id} no banco.`);
        const imovelSalvo = yield database_1.default.imovel.upsert({
            where: { idExterno: imovel._id },
            update: {
                idStays: imovel.id,
                sku: imovel.internalName,
                status: imovel.status,
                idCondominioStays: imovel._idproperty || null,
                condominioIdJestor: condominioIdJestor !== null && condominioIdJestor !== void 0 ? condominioIdJestor : null,
                proprietarioId,
                regiao: imovel.regiao || null, // ✅ NOVO
                sincronizadoNoJestor: false,
            },
            create: {
                idExterno: imovel._id,
                idStays: imovel.id,
                sku: imovel.internalName,
                status: imovel.status,
                idCondominioStays: imovel._idproperty || null,
                condominioIdJestor: condominioIdJestor !== null && condominioIdJestor !== void 0 ? condominioIdJestor : null,
                proprietarioId,
                regiao: imovel.regiao || null, // ✅ NOVO
                sincronizadoNoJestor: false,
            },
        });
        try {
            jestorIdAtualizado = yield (0, imoveis_service_1.sincronizarImovel)(imovelSalvo, condominioIdJestor, proprietarioIdJestor !== null && proprietarioIdJestor !== void 0 ? proprietarioIdJestor : undefined);
            if (jestorIdAtualizado) {
                yield database_1.default.imovel.update({
                    where: { id: imovelSalvo.id },
                    data: {
                        jestorId: jestorIdAtualizado,
                        condominioIdJestor: condominioIdJestor !== null && condominioIdJestor !== void 0 ? condominioIdJestor : null,
                        sincronizadoNoJestor: true,
                    },
                });
            }
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar imóvel ${imovelSalvo.idExterno} com Jestor: ${errorMessage}`);
            yield (0, erro_service_1.registrarErroJestor)('imovel', imovelSalvo.id.toString(), errorMessage);
        }
        return {
            id: imovelSalvo.id,
            sku: (_c = imovelSalvo.sku) !== null && _c !== void 0 ? _c : null,
            jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : null,
        };
    });
}
function salvarHospede(hospede, reservaId, reservaIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
        if (!hospede)
            return;
        // 🔍 Busca o hóspede no banco de dados pelo ID externo
        const hospedeExistente = yield database_1.default.hospede.findUnique({
            where: { idExterno: hospede._id },
        });
        // 🔍 Normaliza valores antes da comparação
        const normalizarTexto = (texto) => (texto === null || texto === void 0 ? void 0 : texto.trim().toLowerCase()) || '';
        const normalizarTelefone = (telefone) => telefone || '';
        const normalizarNumero = (num) => (num === undefined ? null : num);
        // 🔍 Verifica se há diferenças
        const precisaAtualizar = !hospedeExistente ||
            normalizarTexto(hospedeExistente.nomeCompleto) !== normalizarTexto(hospede.name) ||
            normalizarTexto(hospedeExistente.email || '') !== normalizarTexto(hospede.email || '') ||
            (hospedeExistente.dataDeNascimento || '') !== (hospede.birthDate || '') ||
            normalizarTelefone(hospedeExistente.telefone) !== normalizarTelefone((_b = (_a = hospede.phones) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.iso) ||
            (hospedeExistente.cpf || '') !== (((_d = (_c = hospede.documents) === null || _c === void 0 ? void 0 : _c.find((doc) => doc.type === 'cpf')) === null || _d === void 0 ? void 0 : _d.numb) || '') ||
            (hospedeExistente.documento || '') !== (((_f = (_e = hospede.documents) === null || _e === void 0 ? void 0 : _e.find((doc) => doc.type === 'id')) === null || _f === void 0 ? void 0 : _f.numb) || '') ||
            normalizarNumero(hospedeExistente.idade) !== normalizarNumero(hospede.idade) ||
            normalizarNumero(hospedeExistente.reservaIdJestor) !== normalizarNumero(reservaIdJestor);
        if (!precisaAtualizar) {
            (0, logger_1.logDebug)('Hospede', `Nenhuma mudança detectada para hóspede ${hospede._id}. Nenhuma atualização no banco foi realizada.`);
            if (hospedeExistente && !hospedeExistente.sincronizadoNoJestor) {
                try {
                    (0, logger_1.logDebug)('Hospede', `🔄 Sincronizando hóspede ${hospede._id} no Jestor.`);
                    yield (0, hospedes_service_1.sincronizarHospede)(hospedeExistente, reservaIdJestor);
                    yield database_1.default.hospede.update({
                        where: { id: hospedeExistente.id },
                        data: { sincronizadoNoJestor: true },
                    });
                }
                catch (error) {
                    const errorMessage = error.message || 'Erro desconhecido';
                    (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar hóspede ${hospede._id} com Jestor: ${errorMessage}`);
                    yield (0, erro_service_1.registrarErroJestor)('hospede', hospedeExistente.id.toString(), errorMessage);
                }
            }
            return hospedeExistente;
        }
        // ✅ Atualiza ou cria o hóspede no banco
        (0, logger_1.logDebug)('Hospede', `🚨 Atualizando hóspede ${hospede._id} no banco.`);
        const hospedeSalvo = yield database_1.default.hospede.upsert({
            where: { idExterno: hospede._id },
            update: {
                nomeCompleto: hospede.name.trim(),
                email: ((_g = hospede.email) === null || _g === void 0 ? void 0 : _g.trim()) || null,
                dataDeNascimento: hospede.birthDate || null,
                idade: normalizarNumero(hospede.idade),
                telefone: ((_j = (_h = hospede.phones) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.iso) || null,
                cpf: ((_l = (_k = hospede.documents) === null || _k === void 0 ? void 0 : _k.find((doc) => doc.type === 'cpf')) === null || _l === void 0 ? void 0 : _l.numb) || null,
                documento: ((_o = (_m = hospede.documents) === null || _m === void 0 ? void 0 : _m.find((doc) => doc.type === 'id')) === null || _o === void 0 ? void 0 : _o.numb) || null,
                reservaId,
                reservaIdJestor: reservaIdJestor !== null && reservaIdJestor !== void 0 ? reservaIdJestor : null,
                sincronizadoNoJestor: false,
            },
            create: {
                idExterno: hospede._id,
                nomeCompleto: hospede.name.trim(),
                email: ((_p = hospede.email) === null || _p === void 0 ? void 0 : _p.trim()) || null,
                dataDeNascimento: hospede.birthDate || null,
                idade: normalizarNumero(hospede.idade),
                telefone: ((_r = (_q = hospede.phones) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.iso) || null,
                cpf: ((_t = (_s = hospede.documents) === null || _s === void 0 ? void 0 : _s.find((doc) => doc.type === 'cpf')) === null || _t === void 0 ? void 0 : _t.numb) || null,
                documento: ((_v = (_u = hospede.documents) === null || _u === void 0 ? void 0 : _u.find((doc) => doc.type === 'id')) === null || _v === void 0 ? void 0 : _v.numb) || null,
                reservaId,
                reservaIdJestor: reservaIdJestor !== null && reservaIdJestor !== void 0 ? reservaIdJestor : null,
                sincronizadoNoJestor: false,
            },
        });
        try {
            yield (0, hospedes_service_1.sincronizarHospede)(hospedeSalvo, reservaIdJestor);
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar hóspede ${hospedeSalvo.idExterno} com Jestor: ${errorMessage}`);
            yield (0, erro_service_1.registrarErroJestor)('hospede', hospedeSalvo.id.toString(), errorMessage);
        }
        return hospedeSalvo;
    });
}
/**
 * Salva ou atualiza as taxas de reserva no banco de dados e tenta sincronizá-las com o Jestor.
 *
 * @param taxas - Array de taxas detalhadas a serem salvas ou atualizadas.
 */
function salvarTaxasReserva(taxas, reservaIdJestor) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const taxa of taxas) {
            try {
                // 🔍 Valida se a taxa possui um nome válido
                if (!taxa.name || typeof taxa.name !== 'string') {
                    (0, logger_1.logDebug)('Aviso', `⚠️ Taxa inválida encontrada: ${JSON.stringify(taxa)}`);
                    continue;
                }
                // 🔍 Busca a taxa existente no banco pelo par (reservaId, name)
                const taxaExistente = yield database_1.default.taxaReserva.findUnique({
                    where: { reservaId_name: { reservaId: taxa.reservaId, name: taxa.name } },
                });
                // 🔍 Normaliza valores antes da comparação
                const normalizarNumero = (num) => (num === undefined ? null : num);
                // 🔍 Verifica se há diferenças
                const precisaAtualizar = !taxaExistente ||
                    normalizarNumero(taxaExistente.valor) !== normalizarNumero(taxa.valor);
                if (!precisaAtualizar) {
                    (0, logger_1.logDebug)('TaxaReserva', `Nenhuma mudança detectada para taxa "${taxa.name}" da reserva ${taxa.reservaId}. Nenhuma atualização no banco foi realizada.`);
                    if (taxaExistente && !taxaExistente.sincronizadoNoJestor) {
                        try {
                            (0, logger_1.logDebug)('TaxaReserva', `🔄 Sincronizando taxa "${taxa.name}" da reserva ${taxa.reservaId} no Jestor.`);
                            yield (0, taxasReservas_service_1.sincronizarTaxaReserva)(taxaExistente, reservaIdJestor);
                            yield database_1.default.taxaReserva.update({
                                where: { id: taxaExistente.id },
                                data: { sincronizadoNoJestor: true },
                            });
                        }
                        catch (error) {
                            const errorMessage = error.message || 'Erro desconhecido';
                            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar taxa "${taxa.name}" da reserva ${taxa.reservaId} com Jestor: ${errorMessage}`);
                            yield (0, erro_service_1.registrarErroJestor)('taxaReserva', taxa.reservaId.toString(), errorMessage);
                        }
                    }
                    continue;
                }
                // ✅ Atualiza ou cria a taxa no banco
                (0, logger_1.logDebug)('TaxaReserva', `🚨 Atualizando taxa "${taxa.name}" da reserva ${taxa.reservaId} no banco.`);
                const taxaSalva = yield database_1.default.taxaReserva.upsert({
                    where: { reservaId_name: { reservaId: taxa.reservaId, name: taxa.name } },
                    update: {
                        valor: taxa.valor,
                        sincronizadoNoJestor: false,
                    },
                    create: {
                        reservaId: taxa.reservaId,
                        name: taxa.name,
                        valor: taxa.valor,
                        sincronizadoNoJestor: false,
                    },
                });
                try {
                    // 🚀 Sincroniza a taxa com o Jestor
                    yield (0, taxasReservas_service_1.sincronizarTaxaReserva)(taxaSalva, reservaIdJestor);
                    yield database_1.default.taxaReserva.update({
                        where: { id: taxaSalva.id },
                        data: { sincronizadoNoJestor: true },
                    });
                }
                catch (error) {
                    const errorMessage = error.message || 'Erro desconhecido';
                    (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar taxa "${taxa.name}" da reserva ${taxa.reservaId} com Jestor: ${errorMessage}`);
                    yield (0, erro_service_1.registrarErroJestor)('taxaReserva', taxa.reservaId.toString(), errorMessage);
                }
            }
            catch (error) {
                const errorMessage = error.message || 'Erro desconhecido';
                (0, logger_1.logDebug)('Erro', `❌ Erro ao processar taxa "${taxa.name}" da reserva ${taxa.reservaId}: ${errorMessage}`);
            }
        }
    });
}
/**
 * Salva ou atualiza um condomínio no banco de dados e tenta sincronizá-lo com o Jestor.
 *
 * @param condominio - Dados detalhados do condomínio a serem salvos ou atualizados.
 * @returns O condomínio salvo no banco de dados.
 */
function salvarCondominio(condominio) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        // 🔹 Busca o condomínio no banco de dados pelo ID externo (_id)
        const condominioExistente = yield database_1.default.condominio.findUnique({
            where: { idExterno: condominio._id },
        });
        const normalizarTexto = (texto) => (texto === null || texto === void 0 ? void 0 : texto.trim().toLowerCase()) || '';
        const precisaAtualizar = !condominioExistente ||
            normalizarTexto(condominioExistente.idStays) !== normalizarTexto(condominio.id) ||
            normalizarTexto(condominioExistente.sku) !== normalizarTexto(condominio.internalName) ||
            normalizarTexto(condominioExistente.regiao) !== normalizarTexto(condominio.regiao) ||
            normalizarTexto(condominioExistente.status) !== normalizarTexto(condominio.status) ||
            normalizarTexto(condominioExistente.titulo) !== normalizarTexto(condominio.titulo) ||
            condominioExistente.jestorId === null || condominioExistente.jestorId === undefined;
        let jestorIdAtualizado = (_a = condominioExistente === null || condominioExistente === void 0 ? void 0 : condominioExistente.jestorId) !== null && _a !== void 0 ? _a : null;
        if (!precisaAtualizar) {
            (0, logger_1.logDebug)('Condominio', `Nenhuma mudança detectada para condomínio ${condominio._id}. Nenhuma atualização no banco foi realizada.`);
            if (condominioExistente && !condominioExistente.sincronizadoNoJestor) {
                try {
                    (0, logger_1.logDebug)('Condominio', `🔄 Sincronizando condomínio ${condominio._id} no Jestor.`);
                    jestorIdAtualizado = yield (0, condominios_service_1.sincronizarCondominio)(condominioExistente);
                    yield database_1.default.condominio.update({
                        where: { id: condominioExistente.id },
                        data: {
                            jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : condominioExistente.jestorId,
                            sincronizadoNoJestor: true,
                        },
                    });
                }
                catch (error) {
                    const errorMessage = error.message || 'Erro desconhecido';
                    (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar condomínio ${condominio._id} com Jestor: ${errorMessage}`);
                    yield (0, erro_service_1.registrarErroJestor)('condominio', condominioExistente.id.toString(), errorMessage);
                }
            }
            return {
                id: condominioExistente.id,
                sku: (_b = condominioExistente.sku) !== null && _b !== void 0 ? _b : null,
                regiao: (_c = condominioExistente.regiao) !== null && _c !== void 0 ? _c : null,
                titulo: (_d = condominioExistente.titulo) !== null && _d !== void 0 ? _d : null,
                jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : null,
            };
        }
        (0, logger_1.logDebug)('Condominio', `🚨 Atualizando condomínio ${condominio._id} no banco.`);
        const condominioSalvo = yield database_1.default.condominio.upsert({
            where: { idExterno: condominio._id },
            update: {
                idStays: condominio.id,
                sku: condominio.internalName,
                regiao: condominio.regiao,
                status: condominio.status,
                titulo: condominio.titulo,
                sincronizadoNoJestor: false,
            },
            create: {
                idExterno: condominio._id,
                idStays: condominio.id,
                sku: condominio.internalName,
                regiao: condominio.regiao,
                status: condominio.status,
                titulo: condominio.titulo,
                sincronizadoNoJestor: false,
            },
        });
        try {
            jestorIdAtualizado = yield (0, condominios_service_1.sincronizarCondominio)(condominioSalvo);
            if (jestorIdAtualizado) {
                yield database_1.default.condominio.update({
                    where: { id: condominioSalvo.id },
                    data: {
                        jestorId: jestorIdAtualizado,
                        sincronizadoNoJestor: true,
                    },
                });
            }
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar condomínio ${condominioSalvo.idExterno} com Jestor: ${errorMessage}`);
            yield (0, erro_service_1.registrarErroJestor)('condominio', condominioSalvo.id.toString(), errorMessage);
        }
        return {
            id: condominioSalvo.id,
            sku: (_e = condominioSalvo.sku) !== null && _e !== void 0 ? _e : null,
            regiao: (_f = condominioSalvo.regiao) !== null && _f !== void 0 ? _f : null,
            titulo: (_g = condominioSalvo.titulo) !== null && _g !== void 0 ? _g : null,
            jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : null,
        };
    });
}
/**
 * Salva ou atualiza um proprietário no banco de dados e tenta sincronizá-lo com o Jestor.
 *
 * @param nome - Nome do proprietário a ser salvo ou atualizado.
 * @param telefone - Telefone do proprietário (opcional).
 * @returns O ID do proprietário salvo no banco de dados.
 */
function salvarProprietario(nome, telefone) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // 🔍 Normaliza valores antes da comparação
        const normalizarTexto = (texto) => (texto === null || texto === void 0 ? void 0 : texto.trim().toLowerCase()) || '';
        const normalizarTelefone = (telefone) => telefone || '';
        // 🔍 Busca o proprietário existente no banco pelo nome e telefone
        const proprietarioExistente = yield database_1.default.proprietario.findFirst({
            where: { nome, telefone },
        });
        // 🔍 Verifica se há diferenças nos dados
        const precisaAtualizar = !proprietarioExistente ||
            normalizarTexto(proprietarioExistente.nome) !== normalizarTexto(nome) ||
            normalizarTelefone(proprietarioExistente.telefone) !== normalizarTelefone(telefone) ||
            proprietarioExistente.jestorId === null || proprietarioExistente.jestorId === undefined;
        let jestorIdAtualizado = (_a = proprietarioExistente === null || proprietarioExistente === void 0 ? void 0 : proprietarioExistente.jestorId) !== null && _a !== void 0 ? _a : null;
        if (!precisaAtualizar) {
            (0, logger_1.logDebug)('Proprietario', `Nenhuma mudança detectada para proprietário "${nome}". Nenhuma atualização no banco foi realizada.`);
            if (proprietarioExistente && !proprietarioExistente.sincronizadoNoJestor) {
                try {
                    (0, logger_1.logDebug)('Proprietario', `🔄 Sincronizando proprietário "${nome}" no Jestor.`);
                    jestorIdAtualizado = yield (0, proprietarios_service_1.sincronizarProprietario)(proprietarioExistente);
                    yield database_1.default.proprietario.update({
                        where: { id: proprietarioExistente.id },
                        data: {
                            jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : proprietarioExistente.jestorId,
                            sincronizadoNoJestor: true,
                        },
                    });
                }
                catch (error) {
                    const errorMessage = error.message || 'Erro desconhecido';
                    (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar proprietário "${nome}" com Jestor: ${errorMessage}`);
                    yield (0, erro_service_1.registrarErroJestor)('proprietario', proprietarioExistente.id.toString(), errorMessage);
                }
            }
            return {
                id: proprietarioExistente.id,
                jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : null,
            };
        }
        // ✅ Atualiza ou cria o proprietário no banco de dados
        (0, logger_1.logDebug)('Proprietario', `🚨 Atualizando proprietário "${nome}" no banco.`);
        const proprietarioSalvo = yield database_1.default.proprietario.upsert({
            where: { id: (proprietarioExistente === null || proprietarioExistente === void 0 ? void 0 : proprietarioExistente.id) || 0 },
            update: {
                nome,
                telefone: telefone || null,
                sincronizadoNoJestor: false, // Marcamos como não sincronizado até que a sincronização ocorra
            },
            create: {
                nome,
                telefone: telefone || null,
                sincronizadoNoJestor: false,
            },
        });
        try {
            jestorIdAtualizado = yield (0, proprietarios_service_1.sincronizarProprietario)(proprietarioSalvo);
            if (jestorIdAtualizado) {
                yield database_1.default.proprietario.update({
                    where: { id: proprietarioSalvo.id },
                    data: {
                        jestorId: jestorIdAtualizado,
                        sincronizadoNoJestor: true,
                    },
                });
            }
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar proprietário "${nome}" com Jestor: ${errorMessage}`);
            yield (0, erro_service_1.registrarErroJestor)('proprietario', proprietarioSalvo.id.toString(), errorMessage);
        }
        return {
            id: proprietarioSalvo.id,
            jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : null,
        };
    });
}
/**
 * Salva ou atualiza um bloqueio no banco de dados e tenta sincronizá-lo com o Jestor.
 *
 * @param bloqueio - Dados detalhados do bloqueio a serem salvos ou atualizados.
 * @returns O bloqueio salvo no banco de dados.
 */
function salvarBloqueio(bloqueio) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        try {
            console.log(`📌 Salvando bloqueio: ${bloqueio._id}`);
            const normalizarTexto = (texto) => (texto === null || texto === void 0 ? void 0 : texto.trim().toLowerCase()) || '';
            const normalizarNumero = (num) => (num === undefined ? null : num);
            const { imovelIdJestor } = bloqueio, dadosParaSalvar = __rest(bloqueio, ["imovelIdJestor"]); // 👈 separa imovelIdJestor
            // 🔹 Verifica se o bloqueio já existe no banco de dados pelo ID externo (_id)
            const bloqueioExistente = yield database_1.default.bloqueio.findUnique({
                where: { idExterno: bloqueio._id },
            });
            let jestorIdAtualizado = (_a = bloqueioExistente === null || bloqueioExistente === void 0 ? void 0 : bloqueioExistente.jestorId) !== null && _a !== void 0 ? _a : null;
            // 🔹 Define se a atualização é necessária comparando os valores existentes com os novos
            const precisaAtualizar = !bloqueioExistente ||
                bloqueioExistente.localizador !== bloqueio.name ||
                bloqueioExistente.checkIn !== bloqueio.checkIn ||
                bloqueioExistente.checkOut !== bloqueio.checkOut ||
                bloqueioExistente.horaCheckIn !== ((_b = bloqueio.horaCheckIn) !== null && _b !== void 0 ? _b : null) ||
                bloqueioExistente.horaCheckOut !== ((_c = bloqueio.horaCheckOut) !== null && _c !== void 0 ? _c : null) ||
                bloqueioExistente.notaInterna !== (bloqueio.notaInterna || 'Sem nota interna') ||
                normalizarNumero(bloqueioExistente.imovelId) !== normalizarNumero(bloqueio.imovelId) ||
                normalizarNumero(bloqueioExistente.imovelIdJestor) !== normalizarNumero(imovelIdJestor) ||
                normalizarTexto(bloqueioExistente.status) !== normalizarTexto(bloqueio.status) ||
                bloqueioExistente.jestorId === null || bloqueioExistente.jestorId === undefined;
            if (!precisaAtualizar) {
                (0, logger_1.logDebug)('Bloqueio', `Nenhuma mudança detectada para bloqueio ${bloqueio._id}. Nenhuma atualização no banco foi realizada.`);
                (0, logger_1.logDebug)('Bloqueio', `Status de sincronização atual no banco: ${bloqueioExistente === null || bloqueioExistente === void 0 ? void 0 : bloqueioExistente.sincronizadoNoJestor}`);
                if (bloqueioExistente && !bloqueioExistente.sincronizadoNoJestor) {
                    try {
                        (0, logger_1.logDebug)('Bloqueio', `🔄 Sincronizando bloqueio ${bloqueio._id} no Jestor.`);
                        yield (0, bloqueios_service_1.sincronizarBloqueio)(bloqueioExistente, imovelIdJestor !== null && imovelIdJestor !== void 0 ? imovelIdJestor : undefined);
                        yield database_1.default.bloqueio.update({
                            where: { id: bloqueioExistente.id },
                            data: {
                                jestorId: jestorIdAtualizado,
                                sincronizadoNoJestor: true,
                            },
                        });
                    }
                    catch (error) {
                        const errorMessage = error.message || 'Erro desconhecido';
                        (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar bloqueio ${bloqueioExistente.idExterno} com Jestor: ${errorMessage}`);
                        yield (0, erro_service_1.registrarErroJestor)('bloqueio', bloqueioExistente.id.toString(), errorMessage);
                    }
                }
                return bloqueioExistente;
            }
            // ✅ Atualiza ou cria o bloqueio no banco
            (0, logger_1.logDebug)('Bloqueio', `🚨 Atualizando bloqueio ${bloqueio._id} no banco.`);
            // 🔹 Realiza o upsert do bloqueio no banco de dados
            const bloqueioSalvo = yield database_1.default.bloqueio.upsert({
                where: { idExterno: bloqueio._id },
                update: {
                    localizador: bloqueio.name,
                    checkIn: bloqueio.checkIn,
                    checkOut: bloqueio.checkOut,
                    horaCheckIn: (_d = bloqueio.horaCheckIn) !== null && _d !== void 0 ? _d : null,
                    horaCheckOut: (_e = bloqueio.horaCheckOut) !== null && _e !== void 0 ? _e : null,
                    notaInterna: bloqueio.notaInterna || 'Sem nota interna',
                    imovelId: (_f = bloqueio.imovelId) !== null && _f !== void 0 ? _f : null,
                    imovelIdJestor: imovelIdJestor !== null && imovelIdJestor !== void 0 ? imovelIdJestor : null,
                    status: bloqueio.status,
                    jestorId: jestorIdAtualizado,
                    sincronizadoNoJestor: false,
                },
                create: {
                    idExterno: bloqueio._id,
                    localizador: bloqueio.name,
                    checkIn: bloqueio.checkIn,
                    checkOut: bloqueio.checkOut,
                    horaCheckIn: (_g = bloqueio.horaCheckIn) !== null && _g !== void 0 ? _g : null,
                    horaCheckOut: (_h = bloqueio.horaCheckOut) !== null && _h !== void 0 ? _h : null,
                    notaInterna: bloqueio.notaInterna || 'Sem nota interna',
                    imovelId: (_j = bloqueio.imovelId) !== null && _j !== void 0 ? _j : null,
                    imovelIdJestor: imovelIdJestor !== null && imovelIdJestor !== void 0 ? imovelIdJestor : null,
                    status: bloqueio.status,
                    jestorId: jestorIdAtualizado,
                    sincronizadoNoJestor: false,
                },
            });
            try {
                // 🚀 Tenta sincronizar o bloqueio com o Jestor
                yield (0, bloqueios_service_1.sincronizarBloqueio)(bloqueioSalvo, imovelIdJestor !== null && imovelIdJestor !== void 0 ? imovelIdJestor : undefined); // 👈 envia imovelIdJestor
                // ✅ Atualiza o campo `sincronizadoNoJestor` se a sincronização for bem-sucedida
                if (jestorIdAtualizado) {
                    yield database_1.default.bloqueio.update({
                        where: { id: bloqueioSalvo.id },
                        data: {
                            jestorId: jestorIdAtualizado,
                            sincronizadoNoJestor: true,
                        },
                    });
                }
            }
            catch (error) {
                const errorMessage = error.message || 'Erro desconhecido';
                (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar bloqueio ${bloqueioSalvo.idExterno} com Jestor: ${errorMessage}`);
                yield (0, erro_service_1.registrarErroJestor)('bloqueio', bloqueioSalvo.id.toString(), errorMessage);
            }
            return bloqueioSalvo;
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao salvar bloqueio ${bloqueio._id}: ${errorMessage}`);
            throw new Error('Erro ao salvar bloqueio');
        }
    });
}
/**
 * Salva ou atualiza um canal no banco de dados e tenta sincronizá-lo com o Jestor.
 *
 * @param canal - Dados detalhados do canal a serem salvos ou atualizados.
 * @returns O ID do canal salvo no banco de dados.
 */
function salvarCanal(canal) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const normalizarTexto = (texto) => (texto === null || texto === void 0 ? void 0 : texto.trim().toLowerCase()) || '';
        const canalExistente = yield database_1.default.canal.findUnique({
            where: { idExterno: canal._id },
        });
        const precisaAtualizar = !canalExistente ||
            normalizarTexto(canalExistente.titulo) !== normalizarTexto(canal.titulo);
        let jestorIdAtualizado = (_a = canalExistente === null || canalExistente === void 0 ? void 0 : canalExistente.jestorId) !== null && _a !== void 0 ? _a : null;
        if (!precisaAtualizar) {
            (0, logger_1.logDebug)('Canal', `Nenhuma mudança detectada para canal ${canal._id}. Nenhuma atualização no banco foi realizada.`);
            if (canalExistente && !canalExistente.sincronizadoNoJestor) {
                try {
                    (0, logger_1.logDebug)('Canal', `🔄 Sincronizando canal ${canal._id} no Jestor.`);
                    jestorIdAtualizado = yield (0, canais_service_1.sincronizarCanal)(canalExistente);
                    (0, logger_1.logDebug)('Canal', `Codigo interno jestor ${jestorIdAtualizado}.`);
                    yield database_1.default.canal.update({
                        where: { id: canalExistente.id },
                        data: {
                            jestorId: jestorIdAtualizado,
                            sincronizadoNoJestor: true,
                        },
                    });
                }
                catch (error) {
                    const errorMessage = error.message || 'Erro desconhecido';
                    (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar canal ${canal._id} com Jestor: ${errorMessage}`);
                    yield (0, erro_service_1.registrarErroJestor)('canal', canalExistente.id.toString(), errorMessage);
                }
            }
            return { id: canalExistente.id, jestorId: jestorIdAtualizado };
        }
        (0, logger_1.logDebug)('Canal', `🚨 Atualizando canal ${canal._id} no banco.`);
        const canalSalvo = yield database_1.default.canal.upsert({
            where: { idExterno: canal._id },
            update: {
                titulo: canal.titulo,
                sincronizadoNoJestor: false,
            },
            create: {
                idExterno: canal._id,
                titulo: canal.titulo,
                sincronizadoNoJestor: false,
            },
        });
        try {
            jestorIdAtualizado = yield (0, canais_service_1.sincronizarCanal)(canalSalvo);
            (0, logger_1.logDebug)('Canal', `Codigo interno jestor ${jestorIdAtualizado}.`);
            yield database_1.default.canal.update({
                where: { id: canalSalvo.id },
                data: {
                    jestorId: jestorIdAtualizado,
                    sincronizadoNoJestor: true,
                },
            });
            (0, logger_1.logDebug)('Canal', `✅ Canal ${canal._id} sincronizado com sucesso no Jestor.`);
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar canal ${canalSalvo.idExterno} com Jestor: ${errorMessage}`);
            yield (0, erro_service_1.registrarErroJestor)('canal', canalSalvo.id.toString(), errorMessage);
        }
        return { id: canalSalvo.id, jestorId: jestorIdAtualizado };
    });
}
function obterOuCriarCanalReservaDireta() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const idExternoReservaDireta = 'reserva_direta';
        let canalExistente = yield database_1.default.canal.findUnique({
            where: { idExterno: idExternoReservaDireta },
        });
        if (canalExistente) {
            return {
                id: canalExistente.id,
                jestorId: (_a = canalExistente.jestorId) !== null && _a !== void 0 ? _a : null,
            };
        }
        const canalSalvo = yield database_1.default.canal.create({
            data: {
                idExterno: idExternoReservaDireta,
                titulo: 'Reserva Direta',
                sincronizadoNoJestor: false,
            },
        });
        try {
            const jestorId = yield (0, canais_service_1.sincronizarCanal)(canalSalvo);
            yield database_1.default.canal.update({
                where: { id: canalSalvo.id },
                data: {
                    jestorId,
                    sincronizadoNoJestor: true,
                },
            });
            return {
                id: canalSalvo.id,
                jestorId,
            };
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar canal Reserva Direta: ${errorMessage}`);
            yield (0, erro_service_1.registrarErroJestor)('canal', canalSalvo.id.toString(), errorMessage);
            return {
                id: canalSalvo.id,
                jestorId: null,
            };
        }
    });
}
/**
 * Salva ou atualiza um agente no banco de dados e sincroniza com o Jestor,
 * mantendo o campo jestorId atualizado.
 *
 * @param agente - Dados detalhados do agente a serem salvos ou atualizados.
 * @returns O ID do agente salvo no banco de dados.
 */
function salvarAgente(agente) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const normalizarTexto = (texto) => (texto === null || texto === void 0 ? void 0 : texto.trim().toLowerCase()) || '';
        const agenteExistente = yield database_1.default.agente.findUnique({
            where: { idExterno: agente._id },
        });
        const precisaAtualizar = !agenteExistente ||
            normalizarTexto(agenteExistente.nome) !== normalizarTexto(agente.name);
        let jestorIdAtualizado = (_a = agenteExistente === null || agenteExistente === void 0 ? void 0 : agenteExistente.jestorId) !== null && _a !== void 0 ? _a : null;
        // ✅ CASO NÃO precise atualizar os dados do banco local
        if (!precisaAtualizar) {
            (0, logger_1.logDebug)('Agente', `Nenhuma mudança detectada para agente ${agente._id}. Nenhuma atualização no banco foi realizada.`);
            // 🔄 Mas ainda pode ser necessário sincronizar com o Jestor!
            if (agenteExistente && !agenteExistente.sincronizadoNoJestor) {
                try {
                    (0, logger_1.logDebug)('Agente', `🔄 Sincronizando agente ${agente._id} no Jestor.`);
                    // ✅ Garantimos que agenteExistente não é null dentro deste bloco
                    jestorIdAtualizado = yield (0, agentes_service_1.sincronizarAgente)(agenteExistente);
                    // Atualiza o jestorId e marca como sincronizado
                    yield database_1.default.agente.update({
                        where: { id: agenteExistente.id },
                        data: {
                            jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : agenteExistente.jestorId,
                            sincronizadoNoJestor: true,
                        },
                    });
                }
                catch (error) {
                    const errorMessage = error.message || 'Erro desconhecido';
                    (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar agente ${agente._id} com Jestor: ${errorMessage}`);
                    yield (0, erro_service_1.registrarErroJestor)('agente', agenteExistente.id.toString(), errorMessage);
                }
            }
            return { id: agenteExistente.id, jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : null };
        }
        // ✅ CASO precise atualizar ou criar o agente no banco local
        (0, logger_1.logDebug)('Agente', `🚨 Atualizando agente ${agente._id} no banco.`);
        const agenteSalvo = yield database_1.default.agente.upsert({
            where: { idExterno: agente._id },
            update: {
                nome: agente.name,
                sincronizadoNoJestor: false,
            },
            create: {
                idExterno: agente._id,
                nome: agente.name,
                sincronizadoNoJestor: false,
            },
        });
        try {
            (0, logger_1.logDebug)('Agente', `🔄 Sincronizando agente ${agente._id} com o Jestor.`);
            jestorIdAtualizado = yield (0, agentes_service_1.sincronizarAgente)(agenteSalvo);
            // Após sincronização, atualiza jestorId e marca como sincronizado
            if (jestorIdAtualizado) {
                yield database_1.default.agente.update({
                    where: { id: agenteSalvo.id },
                    data: { jestorId: jestorIdAtualizado, sincronizadoNoJestor: true },
                });
            }
        }
        catch (error) {
            const errorMessage = error.message || 'Erro desconhecido';
            (0, logger_1.logDebug)('Erro', `❌ Erro ao sincronizar agente ${agenteSalvo.idExterno} com Jestor: ${errorMessage}`);
            yield (0, erro_service_1.registrarErroJestor)('agente', agenteSalvo.id.toString(), errorMessage);
        }
        return { id: agenteSalvo.id, jestorId: jestorIdAtualizado !== null && jestorIdAtualizado !== void 0 ? jestorIdAtualizado : null };
    });
}
