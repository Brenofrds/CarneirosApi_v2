"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staysWebhookHandler = void 0;
const stays_service_1 = require("./stays.service");
const logger_1 = require("../../utils/logger");
const erro_service_1 = require("../database/erro.service");
// 🟢 Fila de requisições para garantir o processamento serializado
// Utiliza uma fila (array de funções assíncronas) para processar os webhooks um por vez
const webhookQueue = [];
let isProcessing = false; // Flag para controlar se o processamento está em andamento
/**
 * 🚀 Manipulador do Webhook - Adiciona as requisições na fila para processamento serializado
 */
const staysWebhookHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const action = (_a = req.body) === null || _a === void 0 ? void 0 : _a.action; // Ação recebida no payload do webhook (e.g., reservation.modified)
        const payloadId = ((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.payload) === null || _c === void 0 ? void 0 : _c._id) || "undefined"; // ID único do payload (ou "undefined" se ausente)
        const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }); // Data e hora do log
        // Loga o recebimento do webhook para monitoramento
        (0, logger_1.logDebug)('Webhook', `📌 [${timestamp}] Webhook recebido - Action: ${action}, Payload ID: ${payloadId}`);
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
            (0, logger_1.logDebug)('Info', `❌ Ação desconhecida recebida: ${action}`);
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
    }
    catch (error) {
        const action = ((_d = req.body) === null || _d === void 0 ? void 0 : _d.action) || "Ação desconhecida";
        const payloadId = ((_f = (_e = req.body) === null || _e === void 0 ? void 0 : _e.payload) === null || _f === void 0 ? void 0 : _f._id) || "undefined";
        const errorMessage = error.message || "Erro desconhecido";
        // 🔥 Agora registramos o erro no banco de dados
        yield (0, erro_service_1.registrarErroStays)(action, payloadId, errorMessage);
        (0, logger_1.logDebug)('Erro', `❌ Erro ao processar webhook: ${errorMessage}`);
    }
});
exports.staysWebhookHandler = staysWebhookHandler;
/**
 * 🔄 Função que processa a fila de webhooks de forma serializada
 * Garante que apenas um webhook seja processado por vez
 */
function processQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        // Se já estiver processando ou a fila estiver vazia, encerra a função
        if (isProcessing || webhookQueue.length === 0)
            return;
        isProcessing = true; // Marca que o processamento está em andamento
        const next = webhookQueue.shift(); // Remove o primeiro webhook da fila para processamento
        if (next) {
            yield next().catch((error) => {
                (0, logger_1.logDebug)('Erro', `❌ Erro ao processar webhook: ${error.message}`);
            });
        }
        isProcessing = false; // Libera a flag para permitir o próximo processamento
        // Se ainda houver webhooks na fila, chama recursivamente para processar o próximo
        if (webhookQueue.length > 0) {
            processQueue();
        }
    });
}
/**
 * 🛠️ Processa o webhook e envia a resposta ao cliente
 */
function processWebhook(req, res, timestamp) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            // Chama o serviço principal para processar os dados do webhook
            const processedData = yield (0, stays_service_1.processWebhookData)(req.body);
            // Linha de separação nos logs para facilitar a leitura
            console.log("-----------------------------------------------------------------------------------------------------------");
        }
        catch (error) {
            const action = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.action) || "Ação desconhecida";
            const payloadId = ((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.payload) === null || _c === void 0 ? void 0 : _c._id) || "undefined";
            const errorMessage = error.message || "Erro desconhecido";
            // 🔥 Agora registramos o erro no banco de dados
            yield (0, erro_service_1.registrarErroStays)(action, payloadId, errorMessage);
            (0, logger_1.logDebug)('Erro', `❌ [${timestamp}] Erro ao processar webhook: ${errorMessage}`);
            console.log("-----------------------------------------------------------------------------------------------------------");
        }
    });
}
