import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProprietarios() {
  const proprietarios = [
    {
      cpf_cnpj: '123.456.789-00',
      proprietario_principal: 'João da Silva',
      email: 'joao.silva@example.com',
    },
    {
      cpf_cnpj: '987.654.321-00',
      proprietario_principal: 'Maria Oliveira',
      email: 'maria.oliveira@example.com',
    },
  ];

  for (const proprietario of proprietarios) {
    await prisma.proprietario.create({
      data: proprietario,
    });
  }

  console.log('Proprietários inseridos no banco de dados!');
}

seedProprietarios()
  .catch((e) => {
    console.error('Erro ao inserir proprietários:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
