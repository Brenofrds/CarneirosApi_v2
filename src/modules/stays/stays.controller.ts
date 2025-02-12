import { Request, Response } from "express";
import { processWebhookData } from "./stays.service";

export const staysWebhookHandler = async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    console.log(`📌 [${timestamp}] Requisição recebida no webhook:`);
    console.log("Headers:", req.headers);
    console.log("Body:", JSON.stringify(req.body, null, 2)); // Formata o JSON para visualização

    const processedData = await processWebhookData(req.body);

    console.log(`✅ [${timestamp}] Resposta após processamento:`, processedData);

    res.status(200).json({
      message: "Webhook processado com sucesso!",
      processedData,
    });
  } catch (error) {
    const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    console.error(`❌ [${timestamp}] Erro ao processar webhook:`, errorMessage);

    res.status(500).json({
      message: "Erro ao processar o webhook.",
      error: errorMessage,
    });
  }
};
