import prisma from '../../config/database'; // Certifique-se de que o caminho está correto


async function limparBanco() {
  try {
    console.log('🧹 Limpando o banco de dados...');

    // Tabelas sem dependências primeiro
    await prisma.erroSincronizacaoStays.deleteMany();
    await prisma.erroSincronizacaoJestor.deleteMany();

    // Tabelas com dependência de reserva
    await prisma.taxaReserva.deleteMany();
    await prisma.hospede.deleteMany();

    // Tabelas com dependência de imóvel
    await prisma.bloqueio.deleteMany();
    await prisma.reserva.deleteMany();

    // Tabelas de relacionamento principais
    await prisma.imovel.deleteMany();
    await prisma.condominio.deleteMany();
    await prisma.proprietario.deleteMany();

    // Tabelas independentes restantes
    await prisma.agente.deleteMany();
    await prisma.canal.deleteMany();

    console.log('✅ Banco de dados limpo com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao limpar o banco de dados:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

limparBanco();