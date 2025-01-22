import { ReservaData, HospedeDetalhado, AgenteDetalhado } from '../stays.types';

export function transformReserva(reserva: any): ReservaData {
  const diarias = (new Date(reserva.checkOutDate).getTime() - new Date(reserva.checkInDate).getTime()) / (1000 * 60 * 60 * 24);
  const pendenteQuitacao = reserva.price._f_total - (reserva.stats?._f_totalPaid || 0);

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
    totalTaxasExtras: reserva.price.extrasDetails._f_total || 0,
    quantidadeDiarias: diarias,
    partnerCode: reserva.partnerCode || null,
    linkStays: reserva.reservationUrl,
    idImovelStays: reserva._idlisting,
    canaisTitulo: reserva.partner?.name || '',
    agenteId: reserva.agent?._id || null,
    origem: reserva.partner?.name || '',
    status: reserva.type,
    condominio: '',
    regiao: '',
    imovelOficialSku: '',
  };
}

export function transformAgente(agent: any): AgenteDetalhado | null {
  return agent ? { _id: agent._id, name: agent.name } : null;
}
