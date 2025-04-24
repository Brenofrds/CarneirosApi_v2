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
exports.fetchHospedeDetalhado = fetchHospedeDetalhado;
exports.fetchReservas = fetchReservas;
exports.fetchReservaDetalhada = fetchReservaDetalhada;
exports.fetchImovelDetalhado = fetchImovelDetalhado;
exports.fetchCondominioDetalhado = fetchCondominioDetalhado;
const staysClient_1 = __importDefault(require("../../../config/staysClient"));
function fetchHospedeDetalhado(clientId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        try {
            const endpoint = `/booking/clients/${clientId}`;
            const response = yield staysClient_1.default.get(endpoint);
            const data = response.data;
            // Verifica se os dados essenciais existem antes de processar
            if (!data || !data._id || !data.name) {
                console.warn(`⚠️ Dados insuficientes para o hóspede ${clientId}`);
                return null;
            }
            // 📅 Calcula a idade com base na data de nascimento
            let idadeCalculada = undefined;
            if (data.birthDate) {
                try {
                    const birthDate = new Date(data.birthDate);
                    const today = new Date();
                    idadeCalculada = today.getFullYear() - birthDate.getFullYear();
                    // Ajusta caso ainda não tenha feito aniversário este ano
                    if (today.getMonth() < birthDate.getMonth() ||
                        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
                        idadeCalculada--;
                    }
                }
                catch (error) {
                    console.warn(`⚠️ Erro ao calcular idade para hóspede ${data.name}: Data inválida (${data.birthDate})`);
                }
            }
            // Retorna os dados do hóspede incluindo a idade já calculada
            return {
                _id: data._id,
                name: data.name,
                email: data.email,
                isUser: data.isUser,
                birthDate: data.birthDate || null,
                idade: idadeCalculada, // ✅ Agora a idade já está calculada aqui!
                phones: (_a = data.phones) === null || _a === void 0 ? void 0 : _a.map((phone) => ({
                    iso: phone.iso,
                    hint: phone.hint || null,
                })),
                documents: (_b = data.documents) === null || _b === void 0 ? void 0 : _b.map((doc) => ({
                    type: doc.type,
                    numb: doc.numb,
                    issued: doc.issued || null,
                })),
            };
        }
        catch (error) {
            if ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.includes('contactEmails/0/adr must match pattern')) {
                console.warn(`⚠️ Hóspede ignorado devido a dados corrompidos: ${clientId}`);
                return null; // Ignorar o hóspede com dados inválidos
            }
            console.error(`❌ Erro ao buscar detalhes do hóspede ${clientId}:`, ((_f = error.response) === null || _f === void 0 ? void 0 : _f.data) || error.message);
            return null;
        }
    });
}
/**
 * Busca reservas na API Stays com filtros específicos (from, to, dateType, listingId).
 *
 * @param fromDate - Data de início (YYYY-MM-DD).
 * @param toDate - Data de fim (YYYY-MM-DD).
 * @param listingId - ID do imóvel (listingId).
 * @returns Lista de IDs das reservas encontradas.
 */
function fetchReservas(fromDate, toDate, listingId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // 🔹 Construindo a URL apenas com os parâmetros necessários
            const endpoint = `/booking/reservations?from=${fromDate}&to=${toDate}&dateType=arrival&listingId=${listingId}`;
            // 🔹 Fazendo a requisição na API
            const response = yield staysClient_1.default.get(endpoint);
            // 🔹 Retornar apenas os IDs das reservas
            return response.data.map((reserva) => reserva._id);
        }
        catch (error) {
            console.error('❌ Erro ao buscar reservas:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            return [];
        }
    });
}
function fetchReservaDetalhada(reservationId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const endpoint = `/booking/reservations/${reservationId}`;
            const response = yield staysClient_1.default.get(endpoint);
            return response.data;
        }
        catch (error) {
            console.error(`Erro ao buscar detalhes da reserva ${reservationId}:`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            return null;
        }
    });
}
// Função para buscar os detalhes do imóvel e do proprietário usando o listingId
function fetchImovelDetalhado(listingId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const endpoint = `/content/listings/${listingId}`;
            const response = yield staysClient_1.default.get(endpoint);
            const data = response.data;
            // 🔹 Mapeia os status para os valores corretos
            const STATUS_MAP = {
                "active": "Ativo",
                "inactive": "Inativo",
                "hidden": "Oculto",
                "draft": "Rascunho"
            };
            // 🔹 Extrair apenas os campos necessários do imóvel
            const imovelDetalhado = {
                _id: data._id, // ID externo do imóvel na Stays
                id: data.id, // ID interno do imóvel na Stays
                internalName: data.internalName, // Nome interno ou SKU do imóvel
                status: STATUS_MAP[data.status] || "Oculto", // Traduz o status ou usa "Oculto" por padrão
                _idproperty: data._idproperty, // ID externo do condomínio relacionado
            };
            // 🔹 Extrair dados do proprietário (se existirem na resposta)
            const proprietarioDetalhado = data.owner
                ? {
                    nome: data.owner.name,
                    telefone: ((_b = (_a = data.owner.phones) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.iso) || null, // Pega o primeiro telefone se existir
                }
                : null;
            return { imovel: imovelDetalhado, proprietario: proprietarioDetalhado };
        }
        catch (error) {
            console.error(`Erro ao buscar detalhes do imóvel ${listingId}: ${error.message || 'Erro desconhecido'}`);
            return { imovel: null, proprietario: null };
        }
    });
}
/**
 * Função para buscar os detalhes do condomínio usando o ID externo.
 * @param condominioId - ID externo do condomínio na API Stays.
 * @returns Os detalhes do condomínio no formato CondominioDetalhado.
 */
function fetchCondominioDetalhado(condominioId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const endpoint = `/content/properties/${condominioId}`;
            const response = yield staysClient_1.default.get(endpoint);
            // Extrair apenas os campos necessários
            const data = response.data;
            // Mapeia os status para os valores corretos
            const statusMap = {
                "active": "Ativo",
                "inactive": "Inativo",
                "hidden": "Oculto"
            };
            const condominioDetalhado = {
                _id: data._id, // ID externo do condomínio
                id: data.id, // ID interno na Stays
                internalName: data.internalName, // Nome interno ou SKU do condomínio
                regiao: ((_a = data.address) === null || _a === void 0 ? void 0 : _a.region) || "Região não especificada", // Região do condomínio
                status: statusMap[data.status] || "Oculto" // Traduz o status ou usa "Oculto" por padrão
            };
            return condominioDetalhado;
        }
        catch (error) {
            console.error(`Erro ao buscar detalhes do condomínio ${condominioId}:`, ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
            return null;
        }
    });
}
