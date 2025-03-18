import prisma from "../../config/database"; // Importa o cliente Prisma
import { logDebug } from "../../utils/logger";
import { sincronizarErroJestor } from "../jestor/services/erroJestor.service";
import { sincronizarErroStays } from "../jestor/services/erroStays.service";


/**
 * Registra um erro de sincronização no Jestor.
 * Agora divide `dataErro` em `data` (YYYY-MM-DD) e `hora` (HH:mm:ss) sem usar `date-fns`.
 *
 * @param tabela - Nome da tabela do banco de dados (ex: "reserva", "imovel").
 * @param registroId - ID do registro com erro.
 * @param erro - Mensagem de erro detalhada.
 */
export async function registrarErroJestor(tabela: string, registroId: string, erro: string) {
  try {
    const now = new Date();

    // 📆 Formata a data no formato YYYY-MM-DD
    const ano = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, '0'); // Mês começa do zero
    const dia = String(now.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}-${mes}-${dia}`;

    // ⏰ Formata a hora no formato HH:mm:ss
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    const segundos = String(now.getSeconds()).padStart(2, '0');
    const horaFormatada = `${horas}:${minutos}:${segundos}`;

    // 📝 Cria o erro no banco de dados
    const erroSalvo = await prisma.erroSincronizacaoJestor.create({
      data: {
        tabela,
        registroId,
        erro,
        tentativas: 0, // Primeira tentativa falhou
        data: new Date(dataFormatada), // Salva apenas a data
        hora: horaFormatada, // Salva a hora separadamente
        sincronizadoNoJestor: false, // Padrão: ainda não sincronizado
      },
    });

    logDebug('ErroJestor', `❌ Erro registrado: ${tabela} (ID: ${registroId}) - ${erro}`);

    await sincronizarErroJestor(erroSalvo);

  } catch (e) {
    logDebug('Erro', `❌ Falha ao registrar erro na tabela ErroSincronizacaoJestor: ${e}`);
  }
}


/**
 * Registra um erro de sincronização da Stays no banco de dados.
 * Agora divide `dataErro` em `data` (YYYY-MM-DD) e `hora` (HH:mm:ss) sem usar `date-fns`.
 *
 * @param acao - Ação do webhook (ex: "reservation.modified").
 * @param payloadId - ID do payload da Stays.
 * @param erro - Mensagem de erro detalhada.
 */
export async function registrarErroStays(acao: string, payloadId: string, erro: string) {
  try {
    const now = new Date();

    // 📆 Formata a data no formato YYYY-MM-DD
    const ano = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, '0'); // Mês começa do zero
    const dia = String(now.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}-${mes}-${dia}`;

    // ⏰ Formata a hora no formato HH:mm:ss
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    const segundos = String(now.getSeconds()).padStart(2, '0');
    const horaFormatada = `${horas}:${minutos}:${segundos}`;

    // 📝 Cria o erro no banco de dados
    const erroSalvo = await prisma.erroSincronizacaoStays.create({
      data: {
        acao,
        payloadId,
        erro,
        tentativas: 0, // Primeira tentativa falhou
        data: new Date(dataFormatada), // Salva apenas a data
        hora: horaFormatada, // Salva a hora separadamente
        sincronizadoNoJestor: false, // Padrão: ainda não sincronizado
      },
    });

    logDebug('ErroStays', `❌ Erro registrado: ${acao} (Payload ID: ${payloadId}) - ${erro}`);

    // 🔄 Sincroniza automaticamente o erro salvo com o Jestor
    await sincronizarErroStays(erroSalvo);

  } catch (e) {
    logDebug('Erro', `❌ Falha ao registrar erro na tabela ErroSincronizacaoStays: ${e}`);
  }
}