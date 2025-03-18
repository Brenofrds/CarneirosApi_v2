import { fetchReservas, fetchHospedeDetalhado, fetchImovelDetalhado, fetchCondominioDetalhado, fetchReservaDetalhada } from './services/fetchService';
import { transformReserva, transformAgente, transformCanal, transformBloqueio } from './services/transformService';
import { salvarReserva, salvarHospede, salvarImovel, salvarCondominio, salvarTaxasReserva, salvarProprietario, salvarBloqueio, salvarAgente, salvarCanal } from "./services/saveService";
import prisma from "../../config/database"; // Importa o cliente Prisma
import { logDebug } from '../../utils/logger';
import { sincronizarReserva } from "../jestor/services/reservas.service";
import { typeReserva } from '../jestor/jestor.types'; 


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
              return payload.type === "blocked"
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

    // 🔹 Criar/Atualizar Agente e obter ID do banco
    let agenteId: number | null = null;
    if (agenteData) {
      agenteId = await salvarAgente(agenteData);
    }

    // 🔹 Criar/Atualizar Canal e obter ID do banco
    let canalId: number | null = null;
    if (canalData) {
      canalId = await salvarCanal(canalData);
    }

    // 🔹 Buscar e salvar Imóvel e Proprietário primeiro
    let imovelId = null;
    let imovelSku = null;
    let condominioSku = null;
    let condominioRegiao = null; 

    if (payload._idlisting) {
      const { imovel, proprietario } = await fetchImovelDetalhado(payload._idlisting);
      
      if (imovel) {
        imovel.owner = proprietario || undefined; 
        // 🔹 Salvar o imóvel no banco de dados
        const imovelSalvo = await salvarImovel(imovel);
        imovelId = imovelSalvo.id;
        imovelSku = imovelSalvo.sku;

        // 🔹 Se o imóvel tiver um ID de condomínio, buscar e salvar o condomínio de forma síncrona (aguardando o resultado)
        if (imovel._idproperty) {
          const condominioDetalhado = await fetchCondominioDetalhado(imovel._idproperty);

          if (condominioDetalhado) {
            const condominioSalvo = await salvarCondominio(condominioDetalhado);
            condominioSku = condominioSalvo.sku;
            condominioRegiao = condominioSalvo.regiao;
          }
        }

        // 🔹 Se houver um proprietário, salvar no banco
        if (proprietario) {
          const proprietarioId = await salvarProprietario(proprietario.nome, proprietario.telefone);

          // 🔹 Atualizar o imóvel para associar ao proprietário
          await prisma.imovel.update({
            where: { id: imovelId },
            data: { proprietarioId },
          });
        }
      }
    }

    // 🔹 Atualiza a reserva com os IDs corretos
    reservaData.imovelId = imovelId;
    reservaData.imovelOficialSku = imovelSku || '';
    reservaData.condominio = condominioSku || '';
    reservaData.regiao = condominioRegiao || '';
    reservaData.agenteId = agenteId;
    reservaData.canalId = canalId;

    // 🔹 Salvar Reserva no banco com os IDs corretos
    const reservaSalva = await salvarReserva(reservaData);

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

    logDebug('Reserva', `Reserva ${reservaData.localizador} processada com sucesso!`);
    
    return reservaSalva;

  } catch (error: any) {
    logDebug('Erro', `Erro ao processar reserva ${payload._id}: ${error.message}`);
    
    throw new Error(`Erro ao processar reserva ${payload._id}`);
  }
};

/**
 * Processa notificações de bloqueios (reservation.created ou reservation.modified com type: "blocked").
 * Essa função é chamada quando o webhook da Stays indica que uma reserva do tipo "blocked" foi criada ou modificada.
 *
 * @param payload - Objeto contendo os dados da reserva bloqueada recebidos do webhook da Stays.
 */
export const processarBloqueioWebhook = async (payload: any) => {
  try {
    console.log(` Processando webhook para bloqueio ${payload._id}`);

    // 🔹 Transformar os dados do bloqueio para o formato correto
    const bloqueioData = transformBloqueio(payload);

    // 🔹 Buscar e salvar Imóvel, Proprietário e Condomínio antes de registrar o bloqueio.
    let imovelId: number | null = null;

    if (payload._idlisting) {
      // 🔍 Busca detalhes do imóvel e do proprietário na API da Stays
      const { imovel, proprietario } = await fetchImovelDetalhado(payload._idlisting);

      if (imovel) {
        // 🔹 Salvar o imóvel no banco de dados
        const imovelSalvo = await salvarImovel(imovel);
        imovelId = imovelSalvo.id;
        bloqueioData.imovelId = imovelId; // Associa o imóvel ao bloqueio

        // 🔹 Se o imóvel tiver um ID de condomínio, buscar e salvar o condomínio em paralelo
        if (imovel._idproperty) {
          fetchCondominioDetalhado(imovel._idproperty).then(async (condominioDetalhado) => {
            if (condominioDetalhado) {
              await salvarCondominio(condominioDetalhado);
            }
          });
        }

        // 🔹 Se houver um proprietário, salvar no banco
        if (proprietario) {
          const proprietarioId = await salvarProprietario(proprietario.nome, proprietario.telefone);

          // 🔹 Atualizar o imóvel para associar ao proprietário
          await prisma.imovel.update({
            where: { id: imovelId },
            data: { proprietarioId },
          });
        }
      } else {
        console.warn(` Imóvel ${payload._idlisting} não encontrado na API da Stays.`);
      }
    }

    // 🔹 Atualiza os dados do bloqueio com os IDs corretos
    bloqueioData.imovelId = imovelId;

    console.log("🔍 Dados transformados para salvar bloqueio:", bloqueioData);

    // 🔹 Salvar Bloqueio no banco com os IDs corretos
    const bloqueioSalvo = await salvarBloqueio(bloqueioData);

    console.log(` Bloqueio salvo com sucesso: ${bloqueioSalvo.id}`);
    
    return bloqueioSalvo;
  } catch (error) {
    console.error(" Erro ao processar bloqueio:", error);
    
    throw new Error("Erro ao processar bloqueio.");
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
    console.log(`🛠️ Processando atualização para ${novoStatus}: ${payload._id}`);

    // 🔍 Exibe o payload completo para análise
    console.log("🔍 Payload recebido:", JSON.stringify(payload, null, 2));

    // 🔹 Tenta localizar a reserva no banco de dados
    let reservaExistente = await prisma.reserva.findUnique({ where: { idExterno: payload._id } });

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
      };

      // 🔄 Sincroniza a atualização com o Jestor
      console.log(`🔄 Sincronizando reserva ${payload._id} com o Jestor...`);
      await sincronizarReserva(reservaParaSincronizar);
      console.log(`✅ Sincronização concluída para a reserva ${payload._id}.`);

      return reservaAtualizada;
    }

    // 🔴 Se a reserva não existir e o status for "Cancelada", buscamos detalhes na API Stays e processamos a reserva
    if (novoStatus === "Cancelada") {
      console.warn(`⚠️ Reserva ${payload._id} não encontrada no banco. Buscando detalhes na API Stays...`);

      // 📡 Buscar detalhes da reserva na API Stays
      const detalhesReserva = await fetchReservaDetalhada(payload._id);

      if (!detalhesReserva) {
        console.error(`❌ Não foi possível obter detalhes para a reserva ${payload._id}.`);
        throw new Error(`Erro: Reserva ${payload._id} não encontrada na API.`);
      }

      console.log(`🔹 Detalhes da reserva ${payload._id} encontrados. Criando nova reserva...`);

      // 🔄 Processar a reserva usando a função principal que já salva no banco e no Jestor
      return await processarReservaWebhook(detalhesReserva);
    }

    // 🚫 Se o status for "Deletada" e a reserva não existir, **não faz nada** (a reserva foi realmente deletada)
    if (novoStatus === "Deletada") {
      console.warn(`⚠️ Reserva ${payload._id} não encontrada no banco e não pode ser recriada.`);
    }

  } catch (error) {
    console.error(`❌ Erro ao atualizar status para "${novoStatus}":`, error);
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
    // 🔹 Buscar e salvar Imóvel e Proprietário primeiro
    let imovelId: number | null = null;

    if (payload._id) {
      // 🔹 Busca detalhes do imóvel e do proprietário na API da Stays
      const { imovel, proprietario } = await fetchImovelDetalhado(payload._id);

      if (imovel) {
        // 🔹 Salvar o imóvel no banco de dados
        const imovelSalvo = await salvarImovel(imovel);
        imovelId = imovelSalvo.id;

        // 🔹 Se o imóvel tiver um ID de condomínio, buscar e salvar o condomínio em paralelo
        if (imovel._idproperty) {
          fetchCondominioDetalhado(imovel._idproperty).then(async (condominioDetalhado) => {
            if (condominioDetalhado) {
              await salvarCondominio(condominioDetalhado);
            }
          });
        }

        // 🔹 Se houver um proprietário, salvar no banco e associar ao imóvel
        if (proprietario) {
          const proprietarioId = await salvarProprietario(proprietario.nome, proprietario.telefone);

          await prisma.imovel.update({
            where: { id: imovelId },
            data: { proprietarioId },
          });
        }
      }
    }

    logDebug('Imovel', `Imovel ${payload._id} processado com sucesso!`);

    return imovelId;

  } catch (error: any) {
    logDebug('Erro', `Erro ao processar listagem de imóvel ${payload._id}: ${error.message}`);
    throw new Error(`Erro ao processar listagem de imóvel ${payload._id}`);
  }
};