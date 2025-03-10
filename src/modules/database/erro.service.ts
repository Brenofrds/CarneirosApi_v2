import prisma from "../../config/database"; // Importa o cliente Prisma
import { logDebug } from "../../utils/logger";

/**
 * Registra um erro na tabela ErroSincronizacaoJestor.
 * Usado para capturar erros de sincronização do BANCO DE DADOS para o JESTOR.
 * 
 * @param tabela - Nome da tabela (ex: "reserva", "imovel")
 * @param registroId - ID do registro que falhou
 * @param erro - Mensagem de erro detalhada
 */
export async function registrarErroJestor(tabela: string, registroId: string, erro: string) {
  try {
    await prisma.erroSincronizacaoJestor.create({
      data: {
        tabela,
        registroId,
        erro,
        tentativas: 0, // Primeira tentativa falhou
      },
    });
    logDebug('ErroJestor', `❌ Erro registrado: ${tabela} (ID: ${registroId}) - ${erro}`);
  } catch (e) {
    logDebug('Erro', `❌ Falha ao registrar erro na tabela ErroSincronizacaoJestor: ${e}`);
  }
}

/**
 * Registra um erro na tabela ErroSincronizacaoStays.
 * Usado para capturar erros de sincronização da STAYS para o BANCO DE DADOS.
 * 
 * @param acao - Ação do webhook (ex: "reservation.modified").
 * @param payloadId - ID do payload da Stays.
 * @param erro - Mensagem de erro detalhada.
 */
export async function registrarErroStays(acao: string, payloadId: string, erro: string) {
  try {
    await prisma.erroSincronizacaoStays.create({
      data: {
        acao,
        payloadId,
        erro,
        tentativas: 0, // Primeira tentativa falhou
      },
    });
    logDebug('ErroStays', `❌ Erro registrado para ação ${acao} com payload ID ${payloadId}`);
  } catch (e) {
    logDebug('Erro', `❌ Falha ao registrar erro na tabela ErroSincronizacaoStays: ${e}`);
  }
}
