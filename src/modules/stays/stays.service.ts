import staysClient from '../../config/staysClient';

// Interface para os parâmetros de busca de reservas
interface FetchDataReservasParams {
  fromDate: string;
  toDate: string;
  skip: number;
  limit: number;
}

export interface Reserva {
  localizador: string;
  dataCriacao: string;
  checkIn: string;
  checkOut: string;
  quantHospedes: number;
  adultos: number;
  criancas: number;
  infantil: number;
  moeda: string;
  valorTotal: number;
  totalPago: number;
  pendenteQuitacao: number;
  diarias: number;
  codigoParceiro: string;
  linkReserva: string;
  idImovel: string;
  idAgente: string;
  idCanal: string;
}

export interface Agente {
  id: string;
  name: string;
}

export interface Canal {
  id: string;
  titulo: string;
}

// Função para buscar reservas
export async function fetchReservas(fromDate: string, toDate: string, skip: number, limit: number): Promise<void> {
  try {
    const endpoint = `/booking/reservations?from=${fromDate}&to=${toDate}&dateType=arrival&skip=${skip}&limit=${limit}`;
    const response = await staysClient.get(endpoint);
    const reservas = response.data;

    const agentes: Map<string, Agente> = new Map();
    const canais: Map<string, Canal> = new Map();

    console.log('=== Dados das Reservas ===');
    for (const reserva of reservas) {
      // Cálculo das diárias
      const diarias =
        (new Date(reserva.checkOutDate).getTime() - new Date(reserva.checkInDate).getTime()) / (1000 * 60 * 60 * 24);

      // Cálculo do pendente a quitar
      const pendenteQuitacao = reserva.price._f_total - (reserva.stats?._f_totalPaid || 0);

      // Registro do agente
      if (reserva.agent) {
        const agenteId = reserva.agent._id;
        const agenteName = reserva.agent.name;
        if (!agentes.has(agenteId)) {
          agentes.set(agenteId, { id: agenteId, name: agenteName });
        }
      }

      // Registro do canal
      if (reserva.partner) {
        const canalId = reserva.partner._id;
        const canalTitulo = reserva.partner.name;
        if (!canais.has(canalId)) {
          canais.set(canalId, { id: canalId, titulo: canalTitulo });
        }
      }

      // Exibição dos dados da reserva
      console.log('===============================');
      console.log(`Localizador: ${reserva.id}`);
      console.log(`Data de Criação: ${reserva.creationDate}`);
      console.log(`Check-in: ${reserva.checkInDate} às ${reserva.checkInTime}`);
      console.log(`Check-out: ${reserva.checkOutDate} às ${reserva.checkOutTime}`);
      console.log(`Quantidade de Hóspedes: ${reserva.guests}`);
      console.log(`Adultos: ${reserva.guestsDetails.adults}`);
      console.log(`Crianças: ${reserva.guestsDetails.children}`);
      console.log(`Infantil: ${reserva.guestsDetails.infants}`);
      console.log(`Moeda: ${reserva.price.currency}`);
      console.log(`Valor Total: ${reserva.price._f_total}`);
      console.log(`Total Pago: ${reserva.stats._f_totalPaid}`);
      console.log(`Pendente Quitação: ${pendenteQuitacao}`);
      console.log(`Diárias: ${diarias}`);
      console.log(`Código do Parceiro: ${reserva.partnerCode}`);
      console.log(`Link da Reserva: ${reserva.reservationUrl}`);
      console.log(`Imóvel ID: ${reserva._idlisting}`);
      console.log(`Agente ID: ${reserva.agent?._id || 'N/A'}`);
      console.log(`Canal ID: ${reserva.partner?._id || 'N/A'}`);
      console.log('===============================');

      // Chama a função de imóveis para buscar os dados do imóvel relacionado
      if (reserva._idlisting) {
        await fetchImovel(reserva._idlisting);
      }
    }

    // Exibição dos dados dos agentes
    console.log('=== Tabela de Agentes ===');
    agentes.forEach((agente) => {
      console.log(`ID do Agente: ${agente.id}, Nome: ${agente.name}`);
    });

    // Exibição dos dados dos canais
    console.log('=== Tabela de Canais ===');
    canais.forEach((canal) => {
      console.log(`ID do Canal: ${canal.id}, Título: ${canal.titulo}`);
    });
  } catch (error: any) {
    console.error('Erro ao buscar reservas:', error.response?.data || error.message);
  }
}

// Função para buscar dados de um imóvel específico
export async function fetchImovel(listingId: string): Promise<void> {
  try {
    const endpoint = `/content/listings/${listingId}`;
    const response = await staysClient.get(endpoint);
    const imovel = response.data;

    console.log('=== Dados do Imóvel ===');
    console.log('===============================');
    console.log(`SKU: ${imovel.id}`);
    console.log(`ID Stays: ${imovel._id}`);
    console.log(`Proprietário ID: ${imovel._idproperty}`);
    console.log(`Condomínio: ${imovel.address.additional || 'N/A'}`);
    console.log('===============================');
  } catch (error: any) {
    console.error('Erro ao buscar dados do imóvel:', error.response?.data || error.message);
  }
}

// Chama a função de reservas
fetchReservas('2024-03-01', '2024-03-31', 0, 2)
  .then(() => {
    console.log('Processamento concluído.');
  })
  .catch((error) => {
    console.error('Erro no processamento:', error.message);
  });
