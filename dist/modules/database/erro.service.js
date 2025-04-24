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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarErroJestor = registrarErroJestor;
exports.registrarErroStays = registrarErroStays;
const database_1 = __importDefault(require("../../config/database")); // Importa o cliente Prisma
const logger_1 = require("../../utils/logger");
const erroJestor_service_1 = require("../jestor/services/erroJestor.service");
const erroStays_service_1 = require("../jestor/services/erroStays.service");
/**
 * Registra um erro de sincronização no Jestor.
 * Agora divide `dataErro` em `data` (YYYY-MM-DD) e `hora` (HH:mm:ss) sem usar `date-fns`.
 *
 * @param tabela - Nome da tabela do banco de dados (ex: "reserva", "imovel").
 * @param registroId - ID do registro com erro.
 * @param erro - Mensagem de erro detalhada.
 */
function registrarErroJestor(tabela, registroId, erro) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const erroSalvo = yield database_1.default.erroSincronizacaoJestor.create({
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
            (0, logger_1.logDebug)('ErroJestor', `❌ Erro registrado: ${tabela} (ID: ${registroId}) - ${erro}`);
            yield (0, erroJestor_service_1.sincronizarErroJestor)(erroSalvo);
        }
        catch (e) {
            (0, logger_1.logDebug)('Erro', `❌ Falha ao registrar erro na tabela ErroSincronizacaoJestor: ${e}`);
        }
    });
}
/**
 * Registra um erro de sincronização da Stays no banco de dados.
 * Agora divide `dataErro` em `data` (YYYY-MM-DD) e `hora` (HH:mm:ss) sem usar `date-fns`.
 *
 * @param acao - Ação do webhook (ex: "reservation.modified").
 * @param payloadId - ID do payload da Stays.
 * @param erro - Mensagem de erro detalhada.
 * @param payloadJson - Objeto bruto da reserva com erro
 */
function registrarErroStays(acao, payloadId, erro, payloadJson) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const erroSalvo = yield database_1.default.erroSincronizacaoStays.create({
                data: {
                    acao,
                    payloadId,
                    payloadJson: payloadJson ? JSON.stringify(payloadJson) : null,
                    erro,
                    tentativas: 0, // Primeira tentativa falhou
                    data: new Date(dataFormatada), // Salva apenas a data
                    hora: horaFormatada, // Salva a hora separadamente
                    sincronizadoNoJestor: false, // Padrão: ainda não sincronizado
                },
            });
            (0, logger_1.logDebug)('ErroStays', `❌ Erro registrado: ${acao} (Payload ID: ${payloadId}) - ${erro}`);
            // 🔄 Sincroniza automaticamente o erro salvo com o Jestor
            yield (0, erroStays_service_1.sincronizarErroStays)(erroSalvo);
        }
        catch (e) {
            (0, logger_1.logDebug)('Erro', `❌ Falha ao registrar erro na tabela ErroSincronizacaoStays: ${e}`);
        }
    });
}
