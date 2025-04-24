// src/tests/clearDatabase.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Ordem de deleção é importante por causa das constraints de FK
    await prisma.$transaction([
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
  } catch (error) {
    console.error('❌ Erro ao limpar o banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Se executado diretamente (não como módulo)
if (require.main === module) {
  clearDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default clearDatabase;