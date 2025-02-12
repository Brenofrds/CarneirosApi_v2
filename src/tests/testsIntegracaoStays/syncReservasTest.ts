import {
    fetchHospedeDetalhado,
    fetchImovelDetalhado,
    fetchCondominioDetalhado,
    fetchReservaDetalhada,
    fetchReservas,
  } from "../../modules/stays/services/fetchService";
  import {
    transformReserva,
    transformAgente,
    transformCanal,
  } from "../../modules/stays/services/transformService";
  import {
    salvarReserva,
    salvarHospede,
    salvarImovel,
    salvarCondominio,
    salvarTaxasReserva,
  } from "../../modules/stays/services/saveService";
  import prisma from "../../config/database";
  
  /**
   * Processa uma reserva completa (busca, transforma e salva no banco).
   * @param payload - Dados da reserva recebidos da API Stays.
   */
  const processarReserva = async (payload: any) => {
    try {
      console.log(`📌 Processando reserva ${payload._id}`);
  
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
        canalSalvo ? { _id: canalSalvo.idExterno, titulo: canalSalvo.titulo || "" } : null
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
      console.error("❌ Erro ao processar reserva:", error);
      throw new Error("Erro ao processar reserva.");
    }
  };
  
  /**
   * 🔄 Sincroniza reservas entre datas, buscando na API e populando o banco.
   * @param fromDate - Data inicial (YYYY-MM-DD)
   * @param toDate - Data final (YYYY-MM-DD)
   * @param skip - Número de registros para ignorar
   * @param limit - Número máximo de reservas por execução
   */
  const processarReservas = async (fromDate: string, toDate: string, skip: number, limit: number) => {
    try {
      console.log(`📌 Iniciando sincronização de reservas: ${fromDate} até ${toDate}`);
  
      // Buscar IDs das reservas dentro do período
      const reservaIds = await fetchReservas(fromDate, toDate, skip, limit);
  
      for (const reservaId of reservaIds) {
        // Buscar detalhes completos da reserva
        const reservaDetalhada = await fetchReservaDetalhada(reservaId);
        if (!reservaDetalhada) {
          console.warn(`⚠️ Detalhes da reserva ${reservaId} não encontrados.`);
          continue;
        }
  
        // Processar reserva normalmente
        await processarReserva(reservaDetalhada);
      }
  
      console.log("✅ Sincronização de reservas concluída.");
    } catch (error) {
      console.error("❌ Erro ao processar reservas:", error);
    }
  };
  
  /**
   * 🔄 Teste de sincronização manual de reservas
   * 
   * Este script roda a sincronização de reservas de um período específico e verifica 
   * se os dados estão sendo corretamente armazenados no banco de dados.
   * 
   * ⚠️ Certifique-se de rodar este teste em um ambiente controlado para não duplicar registros.
   */
  (async () => {
    try {
      console.log("🔄 Iniciando teste de sincronização de reservas...");
  
      // Defina aqui o período de tempo e a paginação para testes
      const fromDate = "2024-11-01";
      const toDate = "2025-02-05";
      const skip = 0;
      const limit = 5;
  
      // Executa a sincronização de reservas
      await processarReservas(fromDate, toDate, skip, limit);
  
      console.log("✅ Teste de sincronização concluído com sucesso!");
    } catch (error) {
      console.error("❌ Erro durante o teste de sincronização:", error);
    }
  })();
  