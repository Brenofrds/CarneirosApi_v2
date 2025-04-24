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
exports.atualizaCampoSincronizadoNoJestor = atualizaCampoSincronizadoNoJestor;
exports.getAgentesNaoSincronizados = getAgentesNaoSincronizados;
exports.getHospedesNaoSincronizados = getHospedesNaoSincronizados;
exports.getReservasNaoSincronizados = getReservasNaoSincronizados;
exports.getCanaisNaoSincronizados = getCanaisNaoSincronizados;
exports.getImoveisNaoSincronizados = getImoveisNaoSincronizados;
exports.getCondominiosNaoSincronizados = getCondominiosNaoSincronizados;
exports.getTaxasReservasNaoSincronizados = getTaxasReservasNaoSincronizados;
exports.getBloqueiosNaoSincronizados = getBloqueiosNaoSincronizados;
exports.getProprietariosNaoSincronizados = getProprietariosNaoSincronizados;
const database_1 = __importDefault(require("../../config/database"));
/**
 * Atualiza o campo sincronizadoNoJestor para true
 * @param tabela - nome da tabela
 * @param Id - valor do campo usado para encontrar o registro
 * @param nome - nome da taxaReserva ou nome do proprietario
 * @param telefone - telefone do proprietario
 */
function atualizaCampoSincronizadoNoJestor(tabela, id, nome, telefone) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let idInt = 0;
            switch (tabela) {
                case "agente":
                    if (typeof id === 'string') {
                        yield database_1.default.agente.update({
                            where: { idExterno: id },
                            data: { sincronizadoNoJestor: true },
                        });
                    }
                    break;
                case "hospede":
                    if (typeof id === 'string') {
                        yield database_1.default.hospede.update({
                            where: { idExterno: id },
                            data: { sincronizadoNoJestor: true },
                        });
                    }
                    break;
                case "reserva":
                    if (typeof id === 'string') {
                        yield database_1.default.reserva.update({
                            where: { localizador: id },
                            data: { sincronizadoNoJestor: true },
                        });
                    }
                    break;
                case "imovel":
                    if (typeof id === 'string') {
                        yield database_1.default.imovel.update({
                            where: { idExterno: id },
                            data: { sincronizadoNoJestor: true },
                        });
                    }
                    break;
                case "condominio":
                    if (typeof id === 'string') {
                        yield database_1.default.condominio.update({
                            where: { idExterno: id },
                            data: { sincronizadoNoJestor: true },
                        });
                    }
                    break;
                case "taxaReserva":
                    if (typeof id === 'number') {
                        yield database_1.default.taxaReserva.update({
                            where: {
                                id: id,
                                name: nome, // nome do campo no banco de dados: NAME
                            },
                            data: { sincronizadoNoJestor: true },
                        });
                    }
                    break;
                case "canal":
                    if (typeof id === 'string') {
                        yield database_1.default.canal.update({
                            where: { idExterno: id },
                            data: { sincronizadoNoJestor: true },
                        });
                    }
                    break;
                case "bloqueio":
                    if (typeof id === 'string') {
                        yield database_1.default.bloqueio.update({
                            where: { idExterno: id },
                            data: { sincronizadoNoJestor: true },
                        });
                    }
                    break;
                case "proprietario":
                    if (typeof id === 'number') {
                        yield database_1.default.proprietario.update({
                            where: {
                                id: id,
                                nome: nome,
                                telefone: telefone,
                            },
                            data: { sincronizadoNoJestor: true },
                        });
                    }
                    break;
                default:
                    throw new Error(`Tabela '${tabela}' não suportada.`);
            }
        }
        catch (error) {
            console.error(`Erro ao atualizar registro na '${tabela}':`, error.message);
        }
    });
}
/**
 * Busca todos os agentes que ainda não foram sincronizados com o Jestor.
 */
function getAgentesNaoSincronizados() {
    return __awaiter(this, void 0, void 0, function* () {
        const agentes = yield database_1.default.agente.findMany({
            where: {
                sincronizadoNoJestor: false, // Filtra apenas os agentes não sincronizados
            },
        });
        // Verifica se existe registro para sincronizar
        if (agentes.length === 0) {
            console.log("--------------------------------------------------");
            console.log("Todos os agentes ja estao sincronizados!");
            return false;
        }
        else {
            return agentes;
        }
    });
}
/**
 * Busca todos os hospedes que ainda não foram sincronizados com o Jestor.
 */
function getHospedesNaoSincronizados() {
    return __awaiter(this, void 0, void 0, function* () {
        const hospede = yield database_1.default.hospede.findMany({
            where: {
                sincronizadoNoJestor: false, // Filtra apenas os agentes não sincronizados
            },
        });
        // Verifica se existe registro para sincronizar
        if (hospede.length === 0) {
            console.log("--------------------------------------------------");
            console.log("Todos os hospedes ja estao sincronizados!");
            return false;
        }
        else {
            return hospede;
        }
    });
}
/**
 * Busca todos as reservas que ainda não foram sincronizados com o Jestor.
 */
function getReservasNaoSincronizados() {
    return __awaiter(this, void 0, void 0, function* () {
        const reserva = yield database_1.default.reserva.findMany({
            where: {
                sincronizadoNoJestor: false, // Filtra apenas as reservas não sincronizados
            },
        });
        // Verifica se existe registro para sincronizar
        if (reserva.length === 0) {
            console.log("--------------------------------------------------");
            console.log("Todos as reservas ja estao sincronizados!");
            return false;
        }
        else {
            return reserva;
        }
    });
}
/**
 * Busca todos os canais que ainda não foram sincronizados com o Jestor.
 */
function getCanaisNaoSincronizados() {
    return __awaiter(this, void 0, void 0, function* () {
        const canais = yield database_1.default.canal.findMany({
            where: {
                sincronizadoNoJestor: false, // Filtra apenas os canais não sincronizados
            },
        });
        // Verifica se existe registro para sincronizar
        if (canais.length === 0) {
            console.log("--------------------------------------------------");
            console.log("Todos os canais já estão sincronizados!");
            return false;
        }
        return canais;
    });
}
/**
 * Busca todos os imóveis que ainda não foram sincronizados com o Jestor.
 */
function getImoveisNaoSincronizados() {
    return __awaiter(this, void 0, void 0, function* () {
        const imoveis = yield database_1.default.imovel.findMany({
            where: {
                sincronizadoNoJestor: false, // Filtra apenas os imóveis não sincronizados
            },
        });
        // Verifica se existe registro para sincronizar
        if (imoveis.length === 0) {
            console.log("--------------------------------------------------");
            console.log("Todos os imóveis já estão sincronizados!");
            return false;
        }
        return imoveis;
    });
}
/**
 * Busca todos os condominios que ainda não foram sincronizados com o Jestor.
 */
function getCondominiosNaoSincronizados() {
    return __awaiter(this, void 0, void 0, function* () {
        const condominios = yield database_1.default.condominio.findMany({
            where: {
                sincronizadoNoJestor: false, // Filtra apenas os agentes não sincronizados
            },
        });
        // Verifica se existe registro para sincronizar
        if (condominios.length === 0) {
            console.log("--------------------------------------------------");
            console.log("Todos os condominios ja estao sincronizados!");
            return false;
        }
        else {
            return condominios;
        }
    });
}
/**
 * Busca todos as taxasReservas que ainda não foram sincronizados com o Jestor.
 */
function getTaxasReservasNaoSincronizados() {
    return __awaiter(this, void 0, void 0, function* () {
        const taxasReservas = yield database_1.default.taxaReserva.findMany({
            where: {
                sincronizadoNoJestor: false, // Filtra apenas as taxasReservas não sincronizados
            },
        });
        // Verifica se existe registro para sincronizar
        if (taxasReservas.length === 0) {
            console.log("--------------------------------------------------");
            console.log("Todos as taxasReservas ja estao sincronizados!");
            return false;
        }
        else {
            return taxasReservas;
        }
    });
}
/**
 * Busca todos as bloqueios que ainda não foram sincronizados com o Jestor.
 */
function getBloqueiosNaoSincronizados() {
    return __awaiter(this, void 0, void 0, function* () {
        const bloqueios = yield database_1.default.bloqueio.findMany({
            where: {
                sincronizadoNoJestor: false, // Filtra apenas as taxasReservas não sincronizados
            },
        });
        // Verifica se existe registro para sincronizar
        if (bloqueios.length === 0) {
            console.log("--------------------------------------------------");
            console.log("Todos os bloqueios ja estao sincronizados!");
            return false;
        }
        else {
            return bloqueios;
        }
    });
}
/**
 * Busca todos as proprietarios que ainda não foram sincronizados com o Jestor.
 */
function getProprietariosNaoSincronizados() {
    return __awaiter(this, void 0, void 0, function* () {
        const proprietarios = yield database_1.default.proprietario.findMany({
            where: {
                sincronizadoNoJestor: false, // Filtra apenas as taxasReservas não sincronizados
            },
        });
        // Verifica se existe registro para sincronizar
        if (proprietarios.length === 0) {
            console.log("--------------------------------------------------");
            console.log("Todos as proprietarios ja estao sincronizados!");
            //console.log("--------------------------------------------------");
            return false;
        }
        else {
            return proprietarios;
        }
    });
}
