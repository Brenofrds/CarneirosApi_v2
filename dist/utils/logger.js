"use strict";
// logger.ts - Função de log minimalista
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDebug = logDebug;
function logDebug(step, message, data) {
    console.log(`🕒 [${new Date().toLocaleTimeString()}] ${step} - ${message}`);
    if (data) {
        console.log('📄 Dados:', JSON.stringify(data, null, 2));
    }
}
