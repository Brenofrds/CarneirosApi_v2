import { fetchReservas, fetchHospedeDetalhado, fetchImovelDetalhado, fetchCondominioDetalhado, fetchReservaDetalhada } from './services/fetchService';
import { transformReserva, transformAgente, transformCanal, transformBloqueio } from './services/transformService';
import { salvarReserva, salvarHospede, salvarImovel, salvarCondominio, salvarTaxasReserva, salvarProprietario, salvarBloqueio, salvarAgente, salvarCanal, obterOuCriarCanalReservaDireta } from "./services/saveService";
import prisma from "../../config/database"; // Importa o cliente Prisma
import { logDebug } from '../../utils/logger';
import { sincronizarReserva } from "../jestor/services/reservas.service";
import { sincronizarBloqueio } from "../jestor/services/bloqueios.service";
import { typeReserva } from '../jestor/jestor.types'; 
import { typeBloqueio } from '../jestor/jestor.types'; 
import { registrarErroStays } from '../database/erro.service'; 


/**
 * Processa os dados recebidos pelo webhook
 * @param body - Corpo da requisição do webhook
 */
export const processWebhookData = async (body: any) => {
  const { action, payload } = body;
  
  // 🚨 Log apenas em caso de erro de dados
  if (!action || !payload) {
      logDebug('Erro', "Dados inválidos: 'action' ou 'payload' ausentes.");
      throw new Error("Dados inválidos: 'action' ou 'payload' ausentes.");
  }

  try {
      switch (action) {
          case "reservation.created":
          case "reservation.modified":

              logDebug('Reserva', `Processando ${action} para o ID ${payload._id}`); 

              // ✅ Lista de tipos de reserva que devem ser tratados como bloqueios
              const tiposBloqueio = ["blocked", "maintenance"];

              // 🔁 Se o tipo da reserva estiver na lista de bloqueios, processa como bloqueio
              // Caso contrário, processa como uma reserva normal
              return tiposBloqueio.includes(payload.type)
                  ? await processarBloqueioWebhook(payload)
                  : await processarReservaWebhook(payload);

          case "reservation.canceled":
              logDebug('Reserva', `Cancelando reserva ID ${payload._id}`);
              return await processarAtualizacaoStatus(payload, "Cancelada");

          case "reservation.deleted":
              logDebug('Reserva', `Deletando reserva ID ${payload._id}`);
              return await processarAtualizacaoStatus(payload, "Deletada");

          case "listing.modified":
          case "listing.created":
              logDebug('Imóvel', `Processando ${action} para o ID ${payload._id}`);
              return await processarListingWebhook(payload);

          default:
              logDebug('Erro', `Ação desconhecida recebida: ${action}`);
              
              throw new Error(`Ação desconhecida: ${action}`);
      }
      
  } catch (error: any) {
      logDebug('Erro', `Erro ao processar ação ${action}`, error.message);
      
      throw new Error(`Erro ao processar ação ${action}: ${error.message}`);
  }

};


const processarReservaWebhook = async (payload: any) => {
  try {
    // 🔹 Transformar os dados da reserva recebidos no formato correto para salvar
    const reservaData = transformReserva(payload);
    const agenteData = transformAgente(payload.agent);
    const canalData = transformCanal(payload.partner);

    let agenteId: number | null = null;
    let agenteIdJestor: number | null = null;

    if (agenteData) {
      const resultadoAgente = await salvarAgente(agenteData);
      agenteId = resultadoAgente.id;
      agenteIdJestor = resultadoAgente.jestorId;
    }

    // 🔹 Criar/Atualizar Canal e obter ID do banco
    let canalId: number | null = null;
    let canalIdJestor: number | null = null;

    if (canalData) {
      const resultadoCanal = await salvarCanal(canalData);
      canalId = resultadoCanal.id;
      canalIdJestor = resultadoCanal.jestorId;
    } else {
      const canalReservaDireta = await obterOuCriarCanalReservaDireta();
      canalId = canalReservaDireta.id;
      canalIdJestor = canalReservaDireta.jestorId;
    }

    // 🔹 Buscar e salvar Imóvel e Proprietário primeiro
    let imovelId = null;
    let imovelSku = null;
    let imovelIdJestor = null;
    let condominioSku = null;
    let condominioRegiao = null; 
    let condominioIdJestor = null;
    let condominioTitulo = null;

    if (payload._idlisting) {
      const { imovel, proprietario } = await fetchImovelDetalhado(payload._idlisting);
      
      if (imovel) {
        // 🔹 Se o imóvel tiver um ID de condomínio, buscar e salvar o condomínio de forma síncrona (aguardando o resultado)
        if (imovel._idproperty) {
          const condominioDetalhado = await fetchCondominioDetalhado(imovel._idproperty);

          if (condominioDetalhado) {
            const condominioSalvo = await salvarCondominio(condominioDetalhado);
            condominioSku = condominioSalvo.sku;
            condominioRegiao = condominioSalvo.regiao;
            condominioTitulo = condominioSalvo.titulo;
            condominioIdJestor = condominioSalvo.jestorId;
          }
        }

        imovel.owner = proprietario || undefined; 
        // 🔹 Salvar o imóvel no banco de dados
        const imovelSalvo = await salvarImovel(imovel, condominioIdJestor ?? undefined);
        imovelId = imovelSalvo.id;
        imovelSku = imovelSalvo.sku;
        imovelIdJestor = imovelSalvo.jestorId;

        
      }
    }

    // 🔹 Atualiza a reserva com os IDs corretos
    reservaData.imovelId = imovelId;
    reservaData.imovelOficialSku = imovelSku || '';
    reservaData.imovelIdJestor = imovelIdJestor;
    reservaData.condominio = condominioSku || '';
    reservaData.regiao = condominioRegiao || '';
    reservaData.agenteId = agenteId;
    reservaData.agenteIdJestor = agenteIdJestor;
    reservaData.canalId = canalId;
    reservaData.canalIdJestor = canalIdJestor;

    // 🔹 Salvar Reserva no banco com os IDs corretos
    const { id: reservaId, jestorId: reservaIdJestor } = await salvarReserva(reservaData);


    // 🔹 Salva Hóspede (depois de salvar a reserva!)
    if (payload._idclient) {
      const hospedeDetalhado = await fetchHospedeDetalhado(payload._idclient);
      if (hospedeDetalhado) {
        await salvarHospede(hospedeDetalhado, reservaId, reservaIdJestor ?? undefined);
      }
    }

    // 🔹 Salva Taxas da Reserva
    const taxasReservas = payload.price?.extrasDetails?.fees?.map((taxa: { name: string; _f_val: number }) => ({
      reservaId: reservaId,
      name: taxa.name?.trim() || "Taxa Desconhecida",
      valor: taxa._f_val,
    })) || [];

    await salvarTaxasReserva(taxasReservas, reservaIdJestor ?? undefined);

    logDebug('Reserva', `Reserva ${reservaData.localizador} processada com sucesso!`);
    
    return reservaId;

  } catch (error: any) {
    logDebug('Erro', `Erro ao processar reserva ${payload._id}: ${error.message}`);
    
    throw new Error(`Erro ao processar reserva ${payload._id}`);
  }
};

/**
 * Processa notificações de bloqueios (reservation.created ou reservation.modified com type: "blocked").
 *
 * @param payload - Objeto contendo os dados da reserva bloqueada recebidos do webhook da Stays.
 */
export const processarBloqueioWebhook = async (payload: any) => {
  try {
    logDebug("Bloqueio", `🔹 Processando webhook para bloqueio ${payload._id}`);

    // 🔹 Transformar os dados do payload no formato correto
    const bloqueioData = transformBloqueio(payload);

    let imovelId: number | null = null;
    let imovelIdJestor: number | null = null;
    let condominioIdJestor: number | null = null;

    if (payload._idlisting) {
      const { imovel, proprietario } = await fetchImovelDetalhado(payload._idlisting);

      if (imovel) {
        // 🔹 Se tiver ID de condomínio, buscar e salvar antes do imóvel
        if (imovel._idproperty) {
          const condominioDetalhado = await fetchCondominioDetalhado(imovel._idproperty);

          if (condominioDetalhado) {
            const condominioSalvo = await salvarCondominio(condominioDetalhado);
            condominioIdJestor = condominioSalvo.jestorId;
          }
        }

        // 🔹 Atribui o proprietário ao imóvel antes de salvar
        imovel.owner = proprietario || undefined;

        const imovelSalvo = await salvarImovel(imovel, condominioIdJestor ?? undefined);
        imovelId = imovelSalvo.id;
        imovelIdJestor = imovelSalvo.jestorId;

        // 🔹 Atualiza os dados do bloqueio com o ID do imóvel
        bloqueioData.imovelId = imovelId;
        bloqueioData.imovelIdJestor = imovelIdJestor ?? null;
      } else {
        logDebug("Aviso", `⚠️ Imóvel ${payload._idlisting} não encontrado na API da Stays.`);
      }
    }

    // 🔹 Salvar o bloqueio com dados completos
    const bloqueioSalvo = await salvarBloqueio(bloqueioData);

    logDebug("Bloqueio", `✅ Bloqueio ${bloqueioSalvo.id} processado com sucesso!`);
    return bloqueioSalvo;

  } catch (error: any) {
    logDebug("Erro", `❌ Erro ao processar bloqueio ${payload._id}: ${error.message}`);
    throw new Error(`Erro ao processar bloqueio ${payload._id}`);
  }
};


/**
 * Processa notificações de cancelamento ou exclusão de reservas.
 * Se a reserva já existir, apenas atualiza o status no banco de dados e sincroniza no Jestor.
 * Se a reserva não existir e o status for "Cancelada", busca detalhes da reserva na API e cria a reserva.
 *
 * @param payload - Objeto contendo os dados da reserva.
 * @param novoStatus - Novo status a ser atribuído ("Cancelada" ou "Deletada").
 */
const processarAtualizacaoStatus = async (payload: any, novoStatus: string) => {
  try {
    logDebug("Reserva", `Processando status "${novoStatus}" para reserva ${payload._id}`);

    // 🔹 Tenta localizar a reserva no banco de dados
    const reservaExistente = await prisma.reserva.findUnique({ where: { idExterno: payload._id } });

    // ✅ Se a reserva existir, apenas atualiza o status no banco e sincroniza no Jestor
    if (reservaExistente) {
      console.log(`🔄 Atualizando status da reserva existente para "${novoStatus}"...`);

      // 🔄 Atualiza o status da reserva no banco
      const reservaAtualizada = await prisma.reserva.update({
        where: { idExterno: payload._id },
        data: { status: novoStatus, sincronizadoNoJestor: false },
      });

      console.log(`✅ Reserva ${payload._id} atualizada para "${novoStatus}".`);

      // 🔄 Converte para o formato esperado por `sincronizarReserva`
      const reservaParaSincronizar: typeReserva = {
        id: reservaAtualizada.id,
        localizador: reservaAtualizada.localizador,
        idExterno: reservaAtualizada.idExterno,
        dataDaCriacao: reservaAtualizada.dataDaCriacao,
        checkIn: reservaAtualizada.checkIn,
        horaCheckIn: reservaAtualizada.horaCheckIn,
        checkOut: reservaAtualizada.checkOut,
        horaCheckOut: reservaAtualizada.horaCheckOut,
        quantidadeHospedes: reservaAtualizada.quantidadeHospedes,
        quantidadeAdultos: reservaAtualizada.quantidadeAdultos,
        quantidadeCriancas: reservaAtualizada.quantidadeCriancas,
        quantidadeInfantil: reservaAtualizada.quantidadeInfantil,
        moeda: reservaAtualizada.moeda,
        valorTotal: reservaAtualizada.valorTotal,
        totalPago: reservaAtualizada.totalPago,
        pendenteQuitacao: reservaAtualizada.pendenteQuitacao,
        totalTaxasExtras: reservaAtualizada.totalTaxasExtras,
        quantidadeDiarias: reservaAtualizada.quantidadeDiarias,
        partnerCode: reservaAtualizada.partnerCode || null,
        linkStays: reservaAtualizada.linkStays,
        idImovelStays: reservaAtualizada.idImovelStays,
        origem: reservaAtualizada.origem,
        status: reservaAtualizada.status,
        condominio: reservaAtualizada.condominio,
        regiao: reservaAtualizada.regiao,
        imovelOficialSku: reservaAtualizada.imovelOficialSku,
        observacao: reservaAtualizada.observacao || null,
        imovelId: reservaAtualizada.imovelId ?? null,
        canalId: reservaAtualizada.canalId ?? null,
        jestorId: reservaAtualizada.jestorId ?? null,
      };

      await sincronizarReserva(reservaParaSincronizar);

      logDebug("Reserva", `Reserva ${payload._id} atualizada para "${novoStatus}" e sincronizada com sucesso!`);

      return reservaAtualizada;
    }

    // 🔁 Caso não seja uma reserva, tenta tratar como bloqueio
    const bloqueioExistente = await prisma.bloqueio.findFirst({
      where: { idExterno: payload._id },
    });

    if (bloqueioExistente) {
      logDebug("Bloqueio", `🔄 Atualizando status do bloqueio "${payload._id}" para "${novoStatus}"...`);

      const bloqueioAtualizado = await prisma.bloqueio.update({
        where: { id: bloqueioExistente.id },
        data: {
          status: novoStatus,
          sincronizadoNoJestor: false,
        },
      });

      // 🔄 Converte para o formato esperado por `sincronizarBloqueio`
      const bloqueioParaSincronizar: typeBloqueio = {
        id: bloqueioAtualizado.id,
        idExterno: bloqueioAtualizado.idExterno,
        localizador: bloqueioAtualizado.localizador,
        checkIn: bloqueioAtualizado.checkIn,
        horaCheckIn: bloqueioAtualizado.horaCheckIn ?? null,
        checkOut: bloqueioAtualizado.checkOut,
        horaCheckOut: bloqueioAtualizado.horaCheckOut ?? null,
        notaInterna: bloqueioAtualizado.notaInterna ?? null,
        imovelId: bloqueioAtualizado.imovelId ?? null,
        status: bloqueioAtualizado.status ?? null,
        jestorId: bloqueioAtualizado.jestorId ?? null,
      };

      // 🔄 Dispara sincronização com Jestor, se disponível
      await sincronizarBloqueio(bloqueioParaSincronizar);

      logDebug("Bloqueio", `✅ Bloqueio "${payload._id}" atualizado com sucesso.`);
      return bloqueioAtualizado;
    }

    if (novoStatus === "Cancelada") {
      await registrarErroStays(
        "reservation.canceled",
        payload._id,
        "Cancelada recebida mas entidade não encontrada.",
        payload
      );
      return;
    }

    // 🚫 Se o status for "Deletada" e a reserva não existir, **não faz nada** (a reserva foi realmente deletada)
    if (novoStatus === "Deletada") {
      logDebug("Reserva", `Reserva ${payload._id} não encontrada no banco e não pode ser recriada.`);
    }

  } catch (error: any) {
    logDebug("Erro", `Erro ao processar status "${novoStatus}" para reserva ${payload._id}: ${error.message}`);
    throw new Error(`Erro ao atualizar status para "${novoStatus}".`);
  }
};

/**
 * Processa notificações de criação ou modificação de listagens de imóveis.
 *
 * @param payload - Objeto contendo os dados da listagem recebidos do webhook da Stays.
 */
export const processarListingWebhook = async (payload: any) => {
  try {
    let imovelId: number | null = null;
    let condominioIdJestor: number | null = null;

    if (payload._id) {
      // 🔹 Busca detalhes do imóvel e do proprietário na API da Stays
      const { imovel, proprietario } = await fetchImovelDetalhado(payload._id);

      if (imovel) {
        // 🔹 Se o imóvel tiver um ID de condomínio, buscar e salvar o condomínio de forma síncrona
        if (imovel._idproperty) {
          const condominioDetalhado = await fetchCondominioDetalhado(imovel._idproperty);

          if (condominioDetalhado) {
            const condominioSalvo = await salvarCondominio(condominioDetalhado);
            condominioIdJestor = condominioSalvo.jestorId;
          }
        }

        // 🔹 Atribui o proprietário ao objeto do imóvel
        imovel.owner = proprietario || undefined;

        // 🔹 Salvar o imóvel no banco de dados (inclui salvarProprietario internamente)
        const imovelSalvo = await salvarImovel(imovel, condominioIdJestor ?? undefined);
        imovelId = imovelSalvo.id;
      }
    }

    logDebug('Imovel', `🏠 Imóvel ${payload._id} processado com sucesso!`);
    return imovelId;

  } catch (error: any) {
    logDebug('Erro', `❌ Erro ao processar listagem de imóvel ${payload._id}: ${error.message}`);
    throw new Error(`Erro ao processar listagem de imóvel ${payload._id}`);
  }
};