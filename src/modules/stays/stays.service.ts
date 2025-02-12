import { fetchReservas, fetchHospedeDetalhado, fetchImovelDetalhado, fetchCondominioDetalhado, fetchReservaDetalhada } from './services/fetchService';
import { transformReserva, transformAgente, transformCanal } from './services/transformService';
import { salvarReserva, salvarHospede, salvarImovel, salvarCondominio, salvarTaxasReserva } from "./services/saveService";
import prisma from "../../config/database"; // Importa o cliente Prisma

/**
 * Processa as reservas, incluindo agentes, hóspedes, imóveis e condomínios.
 * @param fromDate - Data inicial no formato YYYY-MM-DD.
 * @param toDate - Data final no formato YYYY-MM-DD.
 * @param skip - Quantidade de registros a ignorar para paginação.
 * @param limit - Limite de registros a buscar.
 */
/*
export async function processarReservas(fromDate: string, toDate: string, skip: number, limit: number): Promise<void> {
  try {
    // Buscar apenas os IDs das reservas
    const reservaIds = await fetchReservas(fromDate, toDate, skip, limit);

    for (const reservaId of reservaIds) {
      // Obter os detalhes completos da reserva
      const reservaDetalhada = await fetchReservaDetalhada(reservaId);

      if (!reservaDetalhada) {
        console.warn(`Detalhes da reserva ${reservaId} não encontrados.`);
        continue;
      }

      // Transformar os dados da reserva
      const reservaData = transformReserva(reservaDetalhada);
      const agenteDetalhado = transformAgente(reservaDetalhada.agent);
      const canalDetalhado = transformCanal(reservaDetalhada.partner);
      const hospedeDetalhado = reservaDetalhada._idclient 
        ? await fetchHospedeDetalhado(reservaDetalhada._idclient) 
        : null;

      let imovelId: number | null = null;
      if (reservaDetalhada._idlisting) {
        // Buscar detalhes do imóvel
        const imovelDetalhado = await fetchImovelDetalhado(reservaDetalhada._idlisting);
        if (imovelDetalhado) {
          // Salvar o imóvel e associar o ID
          const imovelSalvo = await salvarImovel(imovelDetalhado);
          imovelId = imovelSalvo.id;

          // Buscar e salvar o condomínio relacionado, se aplicável
          if (imovelDetalhado._idproperty) {
            const condominioDetalhado = await fetchCondominioDetalhado(imovelDetalhado._idproperty);
            if (condominioDetalhado) {
              await salvarCondominio(condominioDetalhado);
            }
          }
        }
      }

      // Atualizar o campo `imovelId` na reserva
      reservaData.imovelId = imovelId;

      // Salvar a reserva
      const reservaSalva = await salvarReserva(reservaData, agenteDetalhado, canalDetalhado);

      // Salvar o hóspede associado à reserva
      if (hospedeDetalhado) {
        await salvarHospede(hospedeDetalhado, reservaSalva.id);
      }

      // Consolidar as taxas de `hostingDetails` e `extrasDetails`
      const taxas = [
        ...(reservaDetalhada.price.hostingDetails?.fees || []),
        ...(reservaDetalhada.price.extrasDetails?.fees || []),
      ].map((taxa: { name: string; _f_val: number }) => ({
        reservaId: reservaSalva.id, // Associar o ID da reserva
        name: taxa.name?.trim() || 'Taxa Desconhecida', // Nome da taxa (ou um padrão)
        valor: taxa._f_val,
      }));

      // Salvar as taxas de reserva
      await salvarTaxasReserva(taxas);
    }

    console.log('Processamento de reservas concluído.');
  } catch (error: any) {
    console.error('Erro ao processar reservas:', error.message || error);
  }
}

*/



// Execução principal
// (async () => {
//  await processarReservas('2024-11-01', '2025-02-05', 0, 2);
// })();

/**
 * Novo codigoo
 */



/**
 * Processa os dados recebidos pelo webhook
 * @param body - Corpo da requisição do webhook
 */
export const processWebhookData = async (body: any) => {
  const { action, payload } = body;
  if (!action || !payload) throw new Error("Dados inválidos: 'action' ou 'payload' ausentes.");

  switch (action) {
    case "reservation.created":
    case "reservation.modified":
      return await processarReservaWebhook(payload); // Agora passamos o objeto inteiro

    default:
      throw new Error(`Ação desconhecida: ${action}`);
  }
};


const processarReservaWebhook = async (payload: any) => {
  try {
    console.log(`📌 Processando webhook para reserva ${payload._id}`);

    // 🔹 Transformar os dados da reserva
    const reservaData = transformReserva(payload);
    const agenteData = transformAgente(payload.agent);
    const canalData = transformCanal(payload.partner);

    // 🔹 Criar/Atualizar Agente
    let agenteSalvo = null;
    if (agenteData) {
      agenteSalvo = await prisma.agente.upsert({
        where: { idExterno: agenteData._id },
        update: { nome: agenteData.name },
        create: { idExterno: agenteData._id, nome: agenteData.name, sincronizadoNoJestor: false },
      });
    }

    // 🔹 Criar/Atualizar Canal
    let canalSalvo = null;
    if (canalData) {
      canalSalvo = await prisma.canal.upsert({
        where: { idExterno: canalData._id },
        update: { titulo: canalData.titulo },
        create: { idExterno: canalData._id, titulo: canalData.titulo },
      });
    }

    // 🔹 Buscar e salvar Imóvel
    let imovelId = null;
    if (payload._idlisting) {
      const imovelDetalhado = await fetchImovelDetalhado(payload._idlisting);
      if (imovelDetalhado) {
        const imovelSalvo = await salvarImovel(imovelDetalhado);
        imovelId = imovelSalvo.id;

        // 🔹 Buscar e salvar Condomínio
        if (imovelDetalhado._idproperty) {
          const condominioDetalhado = await fetchCondominioDetalhado(imovelDetalhado._idproperty);
          if (condominioDetalhado) {
            await salvarCondominio(condominioDetalhado);
          }
        }
      }
    }

    // 🔹 Atualiza a reserva com IDs dos relacionamentos
    reservaData.imovelId = imovelId;
    reservaData.agenteId = agenteSalvo?.idExterno ?? null;
    reservaData.canalId = canalSalvo?.id ?? null;

    const reservaSalva = await salvarReserva(
      reservaData,
      agenteSalvo ? { _id: agenteSalvo.idExterno, name: agenteSalvo.nome } : null,
      canalSalvo ? { _id: canalSalvo.idExterno, titulo: canalSalvo.titulo || "" } : null // ✅ Agora sempre usando `idExterno`
    );
    
    // 🔹 Salva Hóspede (depois de salvar a reserva!)
    if (payload._idclient) {
      const hospedeDetalhado = await fetchHospedeDetalhado(payload._idclient);
      if (hospedeDetalhado) {
        await salvarHospede(hospedeDetalhado, reservaSalva.id);
      }
    }

    // 🔹 Salva Taxas da Reserva
    const taxasReservas = payload.price?.extrasDetails?.fees?.map((taxa: { name: string; _f_val: number }) => ({
      reservaId: reservaSalva.id,
      name: taxa.name?.trim() || "Taxa Desconhecida",
      valor: taxa._f_val,
    })) || [];

    await salvarTaxasReserva(taxasReservas);

    return reservaSalva;
  } catch (error) {
    console.error("Erro ao processar reserva via webhook:", error);
    throw new Error("Erro ao processar reserva.");
  }
};




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