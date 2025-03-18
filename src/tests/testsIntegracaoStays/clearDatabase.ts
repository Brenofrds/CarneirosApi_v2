import prisma from '../../config/database'; // Certifique-se de que o caminho está correto

/**
 * Apaga todos os registros do banco de dados em todas as tabelas.
 * Essa função é apenas para fins de teste ou desenvolvimento.
 */
async function clearDatabase() {
  try {
    console.log('Iniciando limpeza do banco de dados...');

    // Ordem de exclusão para respeitar as relações
    await prisma.erroSincronizacaoJestor.deleteMany({});
    await prisma.erroSincronizacaoStays.deleteMany({});

    console.log('Banco de dados limpo com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar o banco de dados:', error);
  } finally {
    await prisma.$disconnect(); // Sempre desconectar o cliente Prisma
  }
}

// Executar o script
clearDatabase();