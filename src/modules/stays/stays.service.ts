import { fetchReservas, fetchHospedeDetalhado, fetchImovelDetalhado } from './services/fetchService';
import { transformReserva, transformAgente } from './services/transformService';
import { salvarReserva, salvarHospede, salvarImovel } from './services/saveService';

/**
 * Processa as reservas, incluindo agentes, hóspedes e imóveis.
 * @param fromDate - Data inicial no formato YYYY-MM-DD.
 * @param toDate - Data final no formato YYYY-MM-DD.
 * @param skip - Quantidade de registros a ignorar para paginação.
 * @param limit - Limite de registros a buscar.
 */
export async function processarReservas(fromDate: string, toDate: string, skip: number, limit: number): Promise<void> {
  const reservas = await fetchReservas(fromDate, toDate, skip, limit);

  for (const reserva of reservas) {
    // Transformar e salvar dados da reserva
    const reservaData = transformReserva(reserva);
    const agenteDetalhado = transformAgente(reserva.agent);
    const hospedeDetalhado = reserva._idclient ? await fetchHospedeDetalhado(reserva._idclient) : null;

    // Buscar e salvar dados do imóvel relacionado à reserva
    let imovelId: number | null = null;
    if (reserva._idlisting) {
      const imovelDetalhado = await fetchImovelDetalhado(reserva._idlisting);
      if (imovelDetalhado) {
        const imovelSalvo = await salvarImovel(imovelDetalhado);
        imovelId = imovelSalvo.id; // Associar o ID do imóvel salvo à reserva
      }
    }

    // Atualizar o campo imovelId na reserva
    reservaData.imovelId = imovelId;

    // Salvar a reserva, o agente e o hóspede
    const reservaSalva = await salvarReserva(reservaData, agenteDetalhado);
    if (hospedeDetalhado) {
      await salvarHospede(hospedeDetalhado, reservaSalva.id);
    }
  }

  console.log('Processamento de reservas concluído.');
}

// Execução principal
(async () => {
  await processarReservas('2024-02-01', '2024-02-28', 0, 20);
})();



/**
import staysClient from '../../config/staysClient';
import prisma from '../../config/database';
import { ReservaData, HospedeDetalhado, AgenteDetalhado } from './stays.types'; // Ajuste o caminho de importação conforme necessário

/**
 * Busca os detalhes de um hóspede na API Stays.
 * @param clientId - ID do cliente/hóspede.
 * @returns Dados detalhados do hóspede ou null se não encontrado.

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


 * Busca reservas na API Stays e retorna os dados transformados.
 * @param fromDate - Data de início no formato YYYY-MM-DD.
 * @param toDate - Data de fim no formato YYYY-MM-DD.
 * @param skip - Número de registros a pular (paginação).
 * @param limit - Limite de registros a buscar.
 * @returns Uma lista de objetos contendo os dados das reservas e seus hóspedes.

export async function fetchReservas(
  fromDate: string,
  toDate: string,
  skip: number,
  limit: number
): Promise<{ reserva: ReservaData; hospede: HospedeDetalhado | null; agente: AgenteDetalhado | null }[]> {
  try {
    const endpoint = `/booking/reservations?from=${fromDate}&to=${toDate}&dateType=arrival&skip=${skip}&limit=${limit}`;
    const response = await staysClient.get(endpoint);
    const reservas = response.data;

    const resultados = [];

    for (const reserva of reservas) {
      const diarias = (new Date(reserva.checkOutDate).getTime() - new Date(reserva.checkInDate).getTime()) / (1000 * 60 * 60 * 24);
      const pendenteQuitacao = reserva.price._f_total - (reserva.stats?._f_totalPaid || 0);

      const agenteDetalhado: AgenteDetalhado | null = reserva.agent
        ? {
            _id: reserva.agent._id,
            name: reserva.agent.name,
          }
        : null;

      const reservaData: ReservaData = {
        localizador: reserva.id,
        idExterno: reserva._id,
        dataDaCriacao: reserva.creationDate.split('T')[0], // Extrai somente a data
        checkIn: reserva.checkInDate.split('T')[0],       // Extrai somente a data
        horaCheckIn: reserva.checkInTime,                 // Usa somente a hora
        checkOut: reserva.checkOutDate.split('T')[0],     // Extrai somente a data
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
        condominio: '', // Não disponível diretamente
        regiao: '', // Não disponível diretamente
        imovelOficialSku: '', // Não disponível diretamente
      };

      // Buscar detalhes do hóspede relacionado à reserva
      let hospedeDetalhado: HospedeDetalhado | null = null;
      if (reserva._idclient) {
        hospedeDetalhado = await fetchHospedeDetalhado(reserva._idclient);
      }

      resultados.push({ reserva: reservaData, hospede: hospedeDetalhado, agente: agenteDetalhado });
    }

    return resultados;
  } catch (error: any) {
    console.error('Erro ao buscar reservas:', error.response?.data || error.message);
    return [];
  }
}


 * Salva reservas e seus hóspedes relacionados no banco de dados.
 * 
 * @param dados - Lista de objetos contendo dados da reserva e do hóspede relacionado.
 */
/**
 * Salva reservas, seus hóspedes relacionados e agentes no banco de dados.
 * 
 * @param dados - Lista de objetos contendo dados da reserva, do hóspede relacionado e do agente.

export async function salvarReservasNoBanco(dados: { reserva: ReservaData; hospede: HospedeDetalhado | null; agente: AgenteDetalhado | null }[]): Promise<void> {
  try {
    for (const { reserva, hospede, agente } of dados) {
      // Inserir ou atualizar o agente, se disponível
      if (agente) {
        await prisma.agente.upsert({
          where: { idExterno: agente._id },
          update: { nome: agente.name },
          create: {
            idExterno: agente._id,
            nome: agente.name,
            sincronizadoNoJestor: false,
          },
        });
      }

      // Inserir ou atualizar a reserva
      const reservaSalva = await prisma.reserva.upsert({
        where: { localizador: reserva.localizador },
        update: {
          idExterno: reserva.idExterno,
          dataDaCriacao: reserva.dataDaCriacao,
          checkIn: reserva.checkIn,
          horaCheckIn: reserva.horaCheckIn,
          checkOut: reserva.checkOut,
          horaCheckOut: reserva.horaCheckOut,
          quantidadeHospedes: reserva.quantidadeHospedes,
          quantidadeAdultos: reserva.quantidadeAdultos,
          quantidadeCriancas: reserva.quantidadeCriancas,
          quantidadeInfantil: reserva.quantidadeInfantil,
          moeda: reserva.moeda,
          valorTotal: reserva.valorTotal,
          totalPago: reserva.totalPago,
          pendenteQuitacao: reserva.pendenteQuitacao,
          totalTaxasExtras: reserva.totalTaxasExtras,
          quantidadeDiarias: reserva.quantidadeDiarias,
          partnerCode: reserva.partnerCode,
          linkStays: reserva.linkStays,
          idImovelStays: reserva.idImovelStays,
          canaisTitulo: reserva.canaisTitulo,
          agenteId: agente ? agente._id : null, // Relacionar com o ID do agente
          origem: reserva.origem,
          status: reserva.status,
          condominio: reserva.condominio,
          regiao: reserva.regiao,
          imovelOficialSku: reserva.imovelOficialSku,
        },
        create: {
          localizador: reserva.localizador,
          idExterno: reserva.idExterno,
          dataDaCriacao: reserva.dataDaCriacao,
          checkIn: reserva.checkIn,
          horaCheckIn: reserva.horaCheckIn,
          checkOut: reserva.checkOut,
          horaCheckOut: reserva.horaCheckOut,
          quantidadeHospedes: reserva.quantidadeHospedes,
          quantidadeAdultos: reserva.quantidadeAdultos,
          quantidadeCriancas: reserva.quantidadeCriancas,
          quantidadeInfantil: reserva.quantidadeInfantil,
          moeda: reserva.moeda,
          valorTotal: reserva.valorTotal,
          totalPago: reserva.totalPago,
          pendenteQuitacao: reserva.pendenteQuitacao,
          totalTaxasExtras: reserva.totalTaxasExtras,
          quantidadeDiarias: reserva.quantidadeDiarias,
          partnerCode: reserva.partnerCode,
          linkStays: reserva.linkStays,
          idImovelStays: reserva.idImovelStays,
          canaisTitulo: reserva.canaisTitulo,
          agenteId: agente ? agente._id : null, // Relacionar com o ID do agente
          origem: reserva.origem,
          status: reserva.status,
          condominio: reserva.condominio,
          regiao: reserva.regiao,
          imovelOficialSku: reserva.imovelOficialSku,
        },
      });

      // Inserir ou atualizar o hóspede, se disponível
      if (hospede) {
        const telefone = hospede.phones?.[0]?.iso || null;
        const cpf = hospede.documents?.find((doc) => doc.type === 'cpf')?.numb || null;
        const documento = hospede.documents?.find((doc) => doc.type === 'id')?.numb || null;

        await prisma.hospede.upsert({
          where: { idExterno: hospede._id },
          update: {
            nomeCompleto: hospede.name,
            email: hospede.email,
            dataDeNascimento: hospede.birthDate || null, // Salvar diretamente como string
            nacionalidade: hospede.nationality || null,
            fonte: hospede.clientSource,
            telefone,
            cpf,
            documento,
            reservaId: reservaSalva.id, // Relacionar com a reserva salva
          },
          create: {
            idExterno: hospede._id,
            nomeCompleto: hospede.name,
            email: hospede.email,
            dataDeNascimento: hospede.birthDate || null, // Salvar diretamente como string
            nacionalidade: hospede.nationality || null,
            fonte: hospede.clientSource,
            telefone,
            cpf,
            documento,
            reservaId: reservaSalva.id, // Relacionar com a reserva salva
          },
        });
      }
    }

    console.log('Dados salvos no banco de dados com sucesso.');
  } catch (error: any) {
    console.error('Erro ao salvar dados no banco de dados:', error.message);
  }
}

(async () => {
  const reservas = await fetchReservas('2024-02-01', '2024-02-29', 0, 5);
  await salvarReservasNoBanco(reservas);
})()

*/