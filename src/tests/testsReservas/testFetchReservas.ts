import staysClient from '../../config/staysClient';

interface HospedeDetalhado {
  _id: string;
  kind: string;
  fName: string;
  lName: string;
  name: string;
  email: string;
  isUser: boolean;
  creationDate: string;
  birthDate?: string;
  nationality?: string;
  clientSource: string;
  contactEmails: { adr: string }[];
}

export async function fetchHospedeDetalhado(clientId: string): Promise<HospedeDetalhado | null> {
  try {
    const endpoint = `/booking/clients/${clientId}`;
    const response = await staysClient.get(endpoint);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar detalhes do hóspede ${clientId}:`, error.response?.data || error.message);
    return null;
  }
}

export async function fetchReservas(fromDate: string, toDate: string, skip: number, limit: number): Promise<void> {
  try {
    const endpoint = `/booking/reservations?from=${fromDate}&to=${toDate}&dateType=arrival&skip=${skip}&limit=${limit}`;
    const response = await staysClient.get(endpoint);
    const reservas = response.data;

    for (const reserva of reservas) {
      const diarias = (new Date(reserva.checkOutDate).getTime() - new Date(reserva.checkInDate).getTime()) / (1000 * 60 * 60 * 24);
      const pendenteQuitacao = reserva.price._f_total - (reserva.stats?._f_totalPaid || 0);

      const reservaData = {
        localizador: reserva.id,
        idExterno: reserva._id,
        dataDaCriacao: new Date(reserva.creationDate),
        checkIn: new Date(reserva.checkInDate),
        horaCheckIn: new Date(`${reserva.checkInDate}T${reserva.checkInTime}`),
        checkOut: new Date(reserva.checkOutDate),
        horaCheckOut: new Date(`${reserva.checkOutDate}T${reserva.checkOutTime}`),
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
        partnerCode: reserva.partnerCode,
        linkStays: reserva.reservationUrl,
        idImovelStays: reserva._idlisting,
        canaisTitulo: reserva.partner?.name || '',
        agenteId: reserva.agent?._id || null,
        origem: reserva.partner?.name || '',
        status: reserva.type,
        condominio: '', // Não disponível diretamente
        regiao: '', // Não disponível diretamente
        imovelOficialSku: '', // Não disponível diretamente
      };

      console.log('\nDados da Reserva:');
      Object.entries(reservaData).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });

      // Buscar detalhes do hóspede relacionado à reserva
      if (reserva._idclient) {
        const hospede = await fetchHospedeDetalhado(reserva._idclient);
        if (hospede) {
          console.log('\nHóspede Relacionado:');
          console.log(`  Nome: ${hospede.name}`);
          console.log(`  Email: ${hospede.email}`);
          console.log(`  Data de Nascimento: ${hospede.birthDate || 'Não informado'}`);
          console.log(`  Nacionalidade: ${hospede.nationality || 'Não informado'}`);
          console.log(`  Fonte: ${hospede.clientSource}`);
        } else {
          console.log(`Hóspede não encontrado para o Cliente ID: ${reserva._idclient}`);
        }
      } else {
        console.log('Reserva sem hóspede associado.');
      }
    }
  } catch (error: any) {
    console.error('Erro ao buscar reservas:', error.response?.data || error.message);
  }
}

// Exemplo de uso
fetchReservas('2020-02-29', '2020-02-29', 0, 2);
