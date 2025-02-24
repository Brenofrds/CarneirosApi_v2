import { fetchReservas, fetchHospedeDetalhado, fetchImovelDetalhado, fetchCondominioDetalhado, fetchReservaDetalhada } from './services/fetchService';
import { transformReserva, transformAgente, transformCanal, transformBloqueio } from './services/transformService';
import { salvarReserva, salvarHospede, salvarImovel, salvarCondominio, salvarTaxasReserva, salvarProprietario, salvarBloqueio } from "./services/saveService";
import prisma from "../../config/database"; // Importa o cliente Prisma


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
      return payload.type === "blocked"
        ? await processarBloqueioWebhook(payload)
        : await processarReservaWebhook(payload);

    case "reservation.canceled":
      return await processarAtualizacaoStatus(payload, "Cancelada");

    case "reservation.deleted":
      return await processarAtualizacaoStatus(payload, "Deletada");

    case "listing.modified":
    case "listing.created":
      return await processarListingWebhook(payload);

    default:
      throw new Error(`Ação desconhecida: ${action}`);
  }
};


const processarReservaWebhook = async (payload: any) => {
  try {
    console.log(` Processando webhook para reserva ${payload._id}`);

    // 🔹 Transformar os dados da reserva recebidos no formato correto para salvar
    const reservaData = transformReserva(payload);
    const agenteData = transformAgente(payload.agent);
    const canalData = transformCanal(payload.partner);

    // 🔹 Criar/Atualizar Agente e obter ID do banco
    let agenteId: number | null = null;
    if (agenteData) {
      // Busca agente existente para comparar os dados
      const agenteExistente = await prisma.agente.findUnique({
        where: { idExterno: agenteData._id },
        select: { nome: true, sincronizadoNoJestor: true }
      });

      // Verifica se precisa atualizar (se o nome for diferente)
      const precisaAtualizar = !agenteExistente || agenteExistente.nome !== agenteData.name;

      const agenteSalvo = await prisma.agente.upsert({
        where: { idExterno: agenteData._id },
        update: { 
          nome: agenteData.name, 
          sincronizadoNoJestor: precisaAtualizar ? false : agenteExistente?.sincronizadoNoJestor 
        },
        create: { 
          idExterno: agenteData._id, 
          nome: agenteData.name, 
          sincronizadoNoJestor: false 
        },
        select: { id: true }, //  Retorna apenas o ID do banco
      });
      agenteId = agenteSalvo.id;
    }

    // 🔹 Criar/Atualizar Canal e obter ID do banco
    let canalId: number | null = null;
    if (canalData) {
      // Busca canal existente para comparar os dados
      const canalExistente = await prisma.canal.findUnique({
        where: { idExterno: canalData._id },
        select: { titulo: true, sincronizadoNoJestor: true }
      });

      // Verifica se precisa atualizar (se o título for diferente)
      const precisaAtualizar = !canalExistente || canalExistente.titulo !== canalData.titulo;

      const canalSalvo = await prisma.canal.upsert({
        where: { idExterno: canalData._id }, 
        update: { 
          titulo: canalData.titulo,
          sincronizadoNoJestor: precisaAtualizar ? false : canalExistente?.sincronizadoNoJestor 
        },
        create: { 
          idExterno: canalData._id, 
          titulo: canalData.titulo, 
          sincronizadoNoJestor: false 
        },
        select: { id: true }, //  Retorna apenas o ID do banco
      });
      canalId = canalSalvo.id;
    }

    // 🔹 Buscar e salvar Imóvel e Proprietário primeiro
    let imovelId = null;

    if (payload._idlisting) {
      const { imovel, proprietario } = await fetchImovelDetalhado(payload._idlisting);

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
    reservaData.agenteId = agenteId;
    reservaData.canalId = canalId;

    console.log("🔍 Dados transformados para salvar reserva:", reservaData);
    console.log("🔍 Agente salvo ID:", agenteId);
    console.log("🔍 Canal salvo ID:", canalId);

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

    return reservaSalva;
  } catch (error) {
    console.error("Erro ao processar reserva via webhook:", error);
    throw new Error("Erro ao processar reserva.");
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
 * Processa notificações de cancelamento de reservas (reservation.canceled)
 * Essa função busca a reserva no banco e atualiza seu status para "Cancelada".
 *
 * @param payload - Objeto contendo os dados da reserva cancelada.
 */
const processarAtualizacaoStatus = async (payload: any, novoStatus: string) => {
  try {
    console.log(` Processando atualização para ${novoStatus}: ${payload._id}`);

    // 🔹 Busca no banco de dados se o `idExterno` pertence a uma reserva ou um bloqueio
    const reservaExistente = await prisma.reserva.findUnique({ where: { idExterno: payload._id } });
    const bloqueioExistente = await prisma.bloqueio.findUnique({ where: { idExterno: payload._id } });

    if (!reservaExistente && !bloqueioExistente) {
      console.warn(` Nenhuma reserva ou bloqueio encontrado para o ID ${payload._id}.`);
      return null;
    }

    // 🔹 Se for reserva, atualiza o status
    if (reservaExistente) {
      const reservaAtualizada = await prisma.reserva.update({
        where: { idExterno: payload._id },
        data: { status: novoStatus, sincronizadoNoJestor: false },
      });
      console.log(` Reserva ${payload._id} atualizada para "${novoStatus}".`);
      return reservaAtualizada;
    }

    // 🔹 Se for bloqueio, atualiza o status
    if (bloqueioExistente) {
      const bloqueioAtualizado = await prisma.bloqueio.update({
        where: { idExterno: payload._id },
        data: { notaInterna: `Status atualizado para ${novoStatus}`, sincronizadoNoJestor: false },
      });
      console.log(` Bloqueio ${payload._id} atualizado para "${novoStatus}".`);
      return bloqueioAtualizado;
    }
  } catch (error) {
    console.error(` Erro ao atualizar status para "${novoStatus}":`, error);
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
    console.log(` Processando webhook para imóvel ${payload._id}`);

    // 🔹 Buscar e salvar Imóvel e Proprietário primeiro
    let imovelId: number | null = null;

    if (payload._id) {
      // 🔹 Busca detalhes do imóvel e do proprietário na API da Stays
      const { imovel, proprietario } = await fetchImovelDetalhado(payload._id);

      if (imovel) {
        // 🔹 Salvar o imóvel no banco de dados
        const imovelSalvo = await salvarImovel(imovel);
        imovelId = imovelSalvo.id;

        console.log(` Imóvel salvo/atualizado: ${imovelSalvo.idExterno} (ID Interno: ${imovelId})`);

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

          // 🔹 Atualizar o imóvel para associá-lo ao proprietário
          await prisma.imovel.update({
            where: { id: imovelId },
            data: { proprietarioId },
          });

          console.log(` Proprietário salvo/atualizado e vinculado ao imóvel: ${proprietario.nome}`);
        }
      } else {
        console.warn(` Imóvel ${payload._id} não encontrado na API da Stays.`);
      }
    }

    console.log(` Processamento concluído para imóvel ${payload._id}`);
    return imovelId;

  } catch (error) {
    console.error(" Erro ao processar listagem de imóvel:", error);
    throw new Error("Erro ao processar listagem de imóvel.");
  }
};
