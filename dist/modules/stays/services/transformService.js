"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformReserva = transformReserva;
exports.transformAgente = transformAgente;
exports.transformCanal = transformCanal;
exports.transformTaxasReserva = transformTaxasReserva;
exports.transformBloqueio = transformBloqueio;
function transformReserva(reserva) {
    var _a, _b, _c;
    const diarias = (new Date(reserva.checkOutDate).getTime() - new Date(reserva.checkInDate).getTime()) / (1000 * 60 * 60 * 24);
    const pendenteQuitacao = reserva.price._f_total - (((_a = reserva.stats) === null || _a === void 0 ? void 0 : _a._f_totalPaid) || 0);
    const totalTaxasExtras = ((_b = reserva.price.extrasDetails) === null || _b === void 0 ? void 0 : _b.fees.reduce((acc, fee) => acc + fee._f_val, 0)) || 0;
    // ✅ Aplicando a lógica do status corretamente
    let statusReserva = "Pendente"; // Por padrão, assumimos que é "Pendente"
    if (reserva.type === "booked") {
        statusReserva = "Ativo"; // Se for "booked", status será "Ativo"
    }
    else if (reserva.type === "reserved") {
        statusReserva = "Pendente"; // Se for "reserved", status será "Pendente"
    }
    else if (reserva.type === "canceled") {
        statusReserva = "Cancelada";
    }
    return {
        localizador: reserva.id,
        idExterno: reserva._id,
        dataDaCriacao: reserva.creationDate.split('T')[0],
        checkIn: reserva.checkInDate.split('T')[0],
        horaCheckIn: reserva.checkInTime,
        checkOut: reserva.checkOutDate.split('T')[0],
        horaCheckOut: reserva.checkOutTime,
        quantidadeHospedes: reserva.guests,
        quantidadeAdultos: reserva.guestsDetails.adults,
        quantidadeCriancas: reserva.guestsDetails.children,
        quantidadeInfantil: reserva.guestsDetails.infants,
        moeda: reserva.price.currency,
        valorTotal: reserva.price._f_total,
        totalPago: reserva.stats._f_totalPaid,
        pendenteQuitacao: pendenteQuitacao,
        totalTaxasExtras: totalTaxasExtras,
        quantidadeDiarias: diarias,
        partnerCode: reserva.partnerCode || null,
        linkStays: reserva.reservationUrl,
        idImovelStays: reserva._idlisting,
        imovelId: null,
        canalId: null,
        agenteId: null,
        origem: ((_c = reserva.partner) === null || _c === void 0 ? void 0 : _c.name) || '',
        status: statusReserva, // ✅ Lógica aplicada aqui!
        condominio: '',
        regiao: '',
        imovelOficialSku: '',
        observacao: reserva.internalNote || null,
    };
}
function transformAgente(agent) {
    return agent ? { _id: agent._id, name: agent.name } : null;
}
function transformCanal(partner) {
    return partner ? { _id: partner._id, titulo: partner.name } : null;
}
// Função para transformar as taxas de reserva
function transformTaxasReserva(reserva, reservaId) {
    var _a, _b;
    const taxasHospedagem = ((_a = reserva.price.hostingDetails) === null || _a === void 0 ? void 0 : _a.fees) || [];
    const taxasExtras = ((_b = reserva.price.extrasDetails) === null || _b === void 0 ? void 0 : _b.fees) || [];
    // Combina as taxas de hospedagem e extras, criando um array de TaxaReservaDetalhada
    const todasAsTaxas = [...taxasHospedagem, ...taxasExtras].map((taxa) => ({
        reservaId: reservaId,
        name: taxa.name,
        valor: taxa._f_val,
    }));
    return todasAsTaxas;
}
function transformBloqueio(bloqueio) {
    var _a, _b, _c;
    return {
        _id: bloqueio._id, // ID externo único do bloqueio na Stays
        name: bloqueio.id, // Nome ou identificador do bloqueio
        checkIn: bloqueio.checkInDate.split('T')[0], // Data de check-in no formato YYYY-MM-DD
        horaCheckIn: (_a = bloqueio.checkInTime) !== null && _a !== void 0 ? _a : null, // Hora de check-in (se disponível)
        checkOut: bloqueio.checkOutDate.split('T')[0], // Data de check-out no formato YYYY-MM-DD
        horaCheckOut: (_b = bloqueio.checkOutTime) !== null && _b !== void 0 ? _b : null, // Hora de check-out (se disponível)
        notaInterna: (_c = bloqueio.internalNote) !== null && _c !== void 0 ? _c : "Sem nota interna", // Nota associada ao bloqueio
        idImovelStays: bloqueio._idlisting, // ID externo do imóvel na Stays associado ao bloqueio
        imovelId: null, // Será preenchido posteriormente ao buscar no banco
    };
}
