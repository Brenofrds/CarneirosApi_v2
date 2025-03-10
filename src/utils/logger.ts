// logger.ts - Função de log minimalista

export function logDebug(step: string, message: string, data?: any) {
    console.log(`🕒 [${new Date().toLocaleTimeString()}] ${step} - ${message}`);
    
    if (data) {
        console.log('📄 Dados:', JSON.stringify(data, null, 2));
    }
}
