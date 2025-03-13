import { ReservaData, AgenteDetalhado, CanalDetalhado, TaxaReservaDetalhada, BloqueioDetalhado } from '../stays.types';

export function transformReserva(reserva: any): ReservaData {
  const diarias = (new Date(reserva.checkOutDate).getTime() - new Date(reserva.checkInDate).getTime()) / (1000 * 60 * 60 * 24);
  const pendenteQuitacao = reserva.price._f_total - (reserva.stats?._f_totalPaid || 0);
  const totalTaxasExtras = reserva.price.extrasDetails?.fees.reduce((acc: number, fee: { _f_val: number }) => acc + fee._f_val, 0) || 0;

  // ✅ Aplicando a lógica do status corretamente
  let statusReserva = "Pendente"; // Por padrão, assumimos que é "Pendente"
  if (reserva.type === "booked") {
    statusReserva = "Ativo"; // Se for "booked", status será "Ativo"
  } else if (reserva.type === "reserved") {
    statusReserva = "Pendente"; // Se for "reserved", status será "Pendente"
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
    origem: reserva.partner?.name || '',
    status: statusReserva, // ✅ Lógica aplicada aqui!
    condominio: '',
    regiao: '',
    imovelOficialSku: '',
    observacao: reserva.internalNote || null, 
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

export function transformBloqueio(bloqueio: any): BloqueioDetalhado {
  return {
    _id: bloqueio._id, // ID externo único do bloqueio na Stays
    name: bloqueio.id, // Nome ou identificador do bloqueio
    checkIn: bloqueio.checkInDate.split('T')[0], // Data de check-in no formato YYYY-MM-DD
    horaCheckIn: bloqueio.checkInTime ?? null, // Hora de check-in (se disponível)
    checkOut: bloqueio.checkOutDate.split('T')[0], // Data de check-out no formato YYYY-MM-DD
    horaCheckOut: bloqueio.checkOutTime ?? null, // Hora de check-out (se disponível)
    notaInterna: bloqueio.internalNote ?? "Sem nota interna", // Nota associada ao bloqueio
    idImovelStays: bloqueio._idlisting, // ID externo do imóvel na Stays associado ao bloqueio
    imovelId: null, // Será preenchido posteriormente ao buscar no banco
  };
}