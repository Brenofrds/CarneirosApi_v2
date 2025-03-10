import { Request, Response } from "express";
import { processWebhookData } from "./stays.service";
import { logDebug } from "../../utils/logger";
import { registrarErroStays } from "../database/erro.service";


// 🟢 Fila de requisições para garantir o processamento serializado
// Utiliza uma fila (array de funções assíncronas) para processar os webhooks um por vez
const webhookQueue: (() => Promise<void>)[] = [];
let isProcessing = false; // Flag para controlar se o processamento está em andamento

/**
 * 🚀 Manipulador do Webhook - Adiciona as requisições na fila para processamento serializado
 */
export const staysWebhookHandler = async (req: Request, res: Response) => {
  try {
      const action = req.body?.action; // Ação recebida no payload do webhook (e.g., reservation.modified)
      const payloadId = req.body?.payload?._id || "undefined"; // ID único do payload (ou "undefined" se ausente)
      const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }); // Data e hora do log

      // Loga o recebimento do webhook para monitoramento
      logDebug('Webhook', `📌 [${timestamp}] Webhook recebido - Action: ${action}, Payload ID: ${payloadId}`);

      // Define as ações suportadas pela API para evitar o processamento de ações desconhecidas
      const acoesSuportadas = [
          'listing.modified',
          'listing.created',
          'reservation.modified',
          'reservation.created',
          'reservation.canceled',
          'reservation.deleted'
      ];

      // Responde imediatamente ao cliente para evitar timeout, mesmo que o processamento continue em segundo plano
      res.status(200).json({ message: "Webhook recebido. Processamento em andamento." });

      // Se a ação recebida não estiver na lista de ações suportadas, apenas registra o erro e encerra
      if (!acoesSuportadas.includes(action)) {
          logDebug('Info', `❌ Ação desconhecida recebida: ${action}`);
          // Linha de separação nos logs para facilitar a leitura
          console.log("-----------------------------------------------------------------------------------------------------------");
          return;
      }

      // Adiciona o processamento do webhook na fila
      webhookQueue.push(() => processWebhook(req, res, timestamp));

      // Se não estiver processando outro webhook, inicia o processamento da fila
      if (!isProcessing) {
          processQueue();
      }

  } catch (error: any) {
    const action = req.body?.action || "Ação desconhecida";
    const payloadId = req.body?.payload?._id || "undefined";
    const errorMessage = error.message || "Erro desconhecido";

    // 🔥 Agora registramos o erro no banco de dados
    await registrarErroStays(action, payloadId, errorMessage);

    logDebug('Erro', `❌ Erro ao processar webhook: ${errorMessage}`);
  }
};

/**
 * 🔄 Função que processa a fila de webhooks de forma serializada
 * Garante que apenas um webhook seja processado por vez
 */
async function processQueue() {
  // Se já estiver processando ou a fila estiver vazia, encerra a função
  if (isProcessing || webhookQueue.length === 0) return;

  isProcessing = true; // Marca que o processamento está em andamento

  const next = webhookQueue.shift(); // Remove o primeiro webhook da fila para processamento
  if (next) {
    await next().catch((error) => {
      logDebug('Erro', `❌ Erro ao processar webhook: ${error.message}`);
    });
  }

  isProcessing = false; // Libera a flag para permitir o próximo processamento

  // Se ainda houver webhooks na fila, chama recursivamente para processar o próximo
  if (webhookQueue.length > 0) {
    processQueue();
  }
}

/**
 * 🛠️ Processa o webhook e envia a resposta ao cliente
 */
async function processWebhook(req: Request, res: Response, timestamp: string) {
  try {
    // Chama o serviço principal para processar os dados do webhook
    const processedData = await processWebhookData(req.body);
    
    // Linha de separação nos logs para facilitar a leitura
    console.log("-----------------------------------------------------------------------------------------------------------");

  } catch (error: any) {
    const action = req.body?.action || "Ação desconhecida";
    const payloadId = req.body?.payload?._id || "undefined";
    const errorMessage = error.message || "Erro desconhecido";

    // 🔥 Agora registramos o erro no banco de dados
    await registrarErroStays(action, payloadId, errorMessage);

    logDebug('Erro', `❌ [${timestamp}] Erro ao processar webhook: ${errorMessage}`);
    console.log("-----------------------------------------------------------------------------------------------------------");
  }
}
