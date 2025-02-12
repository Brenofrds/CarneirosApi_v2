import { ReservaData, AgenteDetalhado, CanalDetalhado, TaxaReservaDetalhada } from '../stays.types';

export function transformReserva(reserva: any): ReservaData {
  const diarias = (new Date(reserva.checkOutDate).getTime() - new Date(reserva.checkInDate).getTime()) / (1000 * 60 * 60 * 24);
  const pendenteQuitacao = reserva.price._f_total - (reserva.stats?._f_totalPaid || 0);
  const totalTaxasExtras = reserva.price.extrasDetails?.fees.reduce((acc: number, fee: { _f_val: number }) => acc + fee._f_val, 0) || 0;

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

export function transformCanal(partner: any): CanalDetalhado | null {
  return partner ? { _id: partner._id, titulo: partner.name } : null;
}

// Função para transformar as taxas de reserva
export function transformTaxasReserva(reserva: any, reservaId: number): TaxaReservaDetalhada[] {
  const taxasHospedagem = reserva.price.hostingDetails?.fees || [];
  const taxasExtras = reserva.price.extrasDetails?.fees || [];

  // Combina as taxas de hospedagem e extras, criando um array de TaxaReservaDetalhada
  const todasAsTaxas = [...taxasHospedagem, ...taxasExtras].map((taxa: { name: string; _f_val: number }) => ({
    reservaId: reservaId,
    name: taxa.name,
    valor: taxa._f_val,
  }));

  return todasAsTaxas;
}
