import { fetchReservas, fetchHospedeDetalhado, fetchImovelDetalhado, fetchCondominioDetalhado, fetchReservaDetalhada } from './services/fetchService';
import { transformReserva, transformAgente, transformCanal, transformBloqueio } from './services/transformService';
import { salvarReserva, salvarHospede, salvarImovel, salvarCondominio, salvarTaxasReserva, salvarProprietario, salvarBloqueio, salvarAgente, salvarCanal } from "./services/saveService";
import prisma from "../../config/database"; // Importa o cliente Prisma
import { logDebug } from '../../utils/logger';


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
    console.log("📡 Payload recebido no webhook:");
    console.log(JSON.stringify(payload, null, 2));
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
 * Processa notificações de cancelamento ou exclusão de reservas (reservation.canceled/reservation.deleted).
 * Se a reserva ou o bloqueio não existirem, tenta criar um novo registro completo usando processarReservaWebhook.
 *
 * @param payload - Objeto contendo os dados da reserva ou bloqueio.
 * @param novoStatus - Novo status a ser atribuído ("Cancelada" ou "Deletada").
 */
const processarAtualizacaoStatus = async (payload: any, novoStatus: string) => {
  try {
    console.log(`🛠️ Processando atualização para ${novoStatus}: ${payload._id}`);
    
    // 🔍 Exibe o payload completo para análise
    console.log("🔍 Payload recebido:", JSON.stringify(payload, null, 2));

    // 🔹 Tenta localizar a reserva ou o bloqueio pelo ID externo
    let reservaExistente = await prisma.reserva.findUnique({ where: { idExterno: payload._id } });
    let bloqueioExistente = await prisma.bloqueio.findUnique({ where: { idExterno: payload._id } });

    if (!reservaExistente && !bloqueioExistente) {
      console.warn(`⚠️ Nenhuma reserva ou bloqueio encontrado para o ID ${payload._id}. Tentando criar novo registro...`);

      // Tenta processar o webhook como uma nova reserva
      try {
        return await processarReservaWebhook(payload);
      } catch (error) {
        console.error(`❌ Erro ao tentar criar nova reserva/bloqueio:`, error);
        throw new Error(`Erro ao criar nova reserva/bloqueio para ID ${payload._id}`);
      }
    }

    // 🔄 Atualiza o status da reserva existente
    if (reservaExistente) {
      const reservaAtualizada = await prisma.reserva.update({
        where: { idExterno: payload._id },
        data: { status: novoStatus, sincronizadoNoJestor: false },
      });
      console.log(`✅ Reserva ${payload._id} atualizada para "${novoStatus}".`);
      return reservaAtualizada;
    }

    // 🔄 Atualiza o status do bloqueio existente
    if (bloqueioExistente) {
      const bloqueioAtualizado = await prisma.bloqueio.update({
        where: { idExterno: payload._id },
        data: { notaInterna: `Status atualizado para ${novoStatus}`, sincronizadoNoJestor: false },
      });
      console.log(`✅ Bloqueio ${payload._id} atualizado para "${novoStatus}".`);
      return bloqueioAtualizado;
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