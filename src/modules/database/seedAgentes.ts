import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAgentes() {
  const agentes = [
    {
      nome: 'Agente Alpha',
    },
    {
      nome: 'Agente Beta',
    },
    {
      nome: 'Agente Gamma',
    },
  ];

  for (const agente of agentes) {
    await prisma.agente.create({
      data: agente,
    });
  }

  console.log('Agentes inseridos no banco de dados!');
}

seedAgentes()
  .catch((e) => {
    console.error('Erro ao inserir agentes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
