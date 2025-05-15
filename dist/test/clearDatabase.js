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
// src/tests/clearDatabase.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function clearDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Ordem de deleção é importante por causa das constraints de FK
            yield prisma.$transaction([
                prisma.erroSincronizacaoStays.deleteMany(),
                prisma.erroSincronizacaoJestor.deleteMany(),
                prisma.taxaReserva.deleteMany(),
                prisma.hospede.deleteMany(),
                prisma.bloqueio.deleteMany(),
                prisma.reserva.deleteMany(),
                prisma.imovel.deleteMany(),
                prisma.condominio.deleteMany(),
                prisma.proprietario.deleteMany(),
                prisma.canal.deleteMany(),
                prisma.agente.deleteMany(),
            ]);
            console.log('✅ Banco de dados limpo com sucesso');
        }
        catch (error) {
            console.error('❌ Erro ao limpar o banco de dados:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// Se executado diretamente (não como módulo)
if (require.main === module) {
    clearDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
exports.default = clearDatabase;
