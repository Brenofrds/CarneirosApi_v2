import prisma from '../../../config/database';
import { ReservaData, HospedeDetalhado, AgenteDetalhado, ImovelDetalhado, CondominioDetalhado, TaxaReservaDetalhada, CanalDetalhado } from '../stays.types';


export async function salvarReserva(reserva: ReservaData, agente: AgenteDetalhado | null, canal: CanalDetalhado | null) {
  if (agente) {
    await prisma.agente.upsert({
      where: { idExterno: agente._id },
      update: { nome: agente.name },
      create: {
        idExterno: agente._id,
        nome: agente.name,
        sincronizadoNoJestor: false,
      },
    });
  }

  let canalSalvo = null;
  if (canal) {
    canalSalvo = await prisma.canal.upsert({
      where: { idExterno: canal._id },
      update: { titulo: canal.titulo },
      create: {
        idExterno: canal._id,
        titulo: canal.titulo,
      },
    });
  }

  return await prisma.reserva.upsert({
    where: { localizador: reserva.localizador },
    update: {
      ...reserva,
      canalId: canalSalvo ? canalSalvo.id : null, // Agora associando corretamente o ID do canal salvo
    },
    create: {
      ...reserva,
      canalId: canalSalvo ? canalSalvo.id : null, // Agora associando corretamente o ID do canal salvo
    },
  });
}


export async function salvarHospede(hospede: HospedeDetalhado | null, reservaId: number) {
  if (hospede) {
    const telefone = hospede.phones?.[0]?.iso || null;
    const cpf = hospede.documents?.find((doc) => doc.type === 'cpf')?.numb || null;
    const documento = hospede.documents?.find((doc) => doc.type === 'id')?.numb || null;

    await prisma.hospede.upsert({
      where: { idExterno: hospede._id },
      update: {
        nomeCompleto: hospede.name,
        email: hospede.email,
        dataDeNascimento: hospede.birthDate || null,
        telefone,
        cpf,
        documento,
        reservaId,
      },
      create: {
        idExterno: hospede._id,
        nomeCompleto: hospede.name,
        email: hospede.email,
        dataDeNascimento: hospede.birthDate || null,
        telefone,
        cpf,
        documento,
        reservaId,
      },
    });
  }
}



export async function salvarImovel(imovel: ImovelDetalhado) {
  return await prisma.imovel.upsert({
    where: { idExterno: imovel._id }, // Verifica se o imóvel já existe pelo ID externo
    update: {
      idStays: imovel.id,             // Atualiza o ID interno da Stays
      sku: imovel.internalName,       // Atualiza o SKU (nome interno)
      status: imovel.status,          // Atualiza o status
      idCondominioStays: imovel._idproperty || null, // Atualiza o ID do condomínio relacionado
    },
    create: {
      idExterno: imovel._id,          // Cria um novo registro com o ID externo
      idStays: imovel.id,             // Preenche o ID interno da Stays
      sku: imovel.internalName,       // Preenche o SKU (nome interno)
      status: imovel.status,          // Preenche o status
      idCondominioStays: imovel._idproperty || null, // Preenche o ID do condomínio relacionado
      sincronizadoNoJestor: false,    // Define o estado inicial de sincronização
    },
  });
}



export async function salvarCondominio(condominio: CondominioDetalhado) {
  try {
    return await prisma.condominio.upsert({
      where: { idExterno: condominio._id }, // Verifica se o condomínio já existe pelo ID externo
      update: {
        idStays: condominio.id,             // Atualiza o ID interno da Stays
        sku: condominio.internalName,       // Atualiza o SKU (nome interno)
        regiao: condominio.regiao,          // Atualiza a região
      },
      create: {
        idExterno: condominio._id,          // Cria um novo registro com o ID externo
        idStays: condominio.id,             // Preenche o ID interno da Stays
        sku: condominio.internalName,       // Preenche o SKU (nome interno)
        regiao: condominio.regiao,          // Preenche a região
        sincronizadoNoJestor: false,        // Define o estado inicial de sincronização como falso
      },
    });
  } catch (error) {
    console.error("Erro ao salvar o condomínio:", error);
    throw new Error("Não foi possível salvar o condomínio.");
  }
}



export async function salvarTaxasReserva(taxas: TaxaReservaDetalhada[]) {
  try {
    for (const taxa of taxas) {
      if (!taxa.name || typeof taxa.name !== 'string') {
        console.warn(`Taxa inválida encontrada: ${JSON.stringify(taxa)}`);
        continue; // Ignorar taxa inválida
      }

      await prisma.taxaReserva.upsert({
        where: {
          reservaId_name: { reservaId: taxa.reservaId, name: taxa.name }, // Chave única
        },
        update: {
          valor: taxa.valor, // Atualiza o valor se já existir
        },
        create: {
          reservaId: taxa.reservaId,
          name: taxa.name,
          valor: taxa.valor,
        },
      });
    }
  } catch (error) {
    console.error('Erro ao salvar taxas de reserva:', error);
    throw new Error('Não foi possível salvar as taxas de reserva.');
  }
}




/**
 * NOVO CODIGO ABAIXO
 */
/*
export const createReservation = async (payload: any) => {
  console.log("🔹 Criando nova reserva...");

  try {
    const reservation = await saveReservation(payload);
    console.log("✅ Reserva criada com sucesso:", reservation);
    return reservation;
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    throw new Error("Erro ao criar reserva.");
  }
};

export const updateReservation = async (payload: any) => {
  console.log("🔹 Atualizando reserva existente...");

  try {
    const reservation = await saveReservation(payload);
    console.log("✅ Reserva atualizada com sucesso:", reservation);
    return reservation;
  } catch (error) {
    console.error("Erro ao atualizar reserva:", error);
    throw new Error("Erro ao atualizar reserva.");
  }
};

const saveReservation = async (payload: any) => {
  // 🔹 Transformação dos dados
  const reservaData = transformReserva(payload);
  const agenteData = transformAgente(payload.agent);
  const canalData = transformCanal(payload.partner);

  // 1️⃣ Criar/Atualizar o Agente
  let agenteSalvo = null;
  if (agenteData) {
    agenteSalvo = await prisma.agente.upsert({
      where: { idExterno: agenteData._id },
      update: { nome: agenteData.name },
      create: {
        idExterno: agenteData._id,
        nome: agenteData.name,
        sincronizadoNoJestor: false,
      },
    });
  }

  // 2️⃣ Criar/Atualizar o Canal
  let canalSalvo = null;
  if (canalData) {
    canalSalvo = await prisma.canal.upsert({
      where: { idExterno: canalData._id },
      update: { titulo: canalData.titulo },
      create: {
        idExterno: canalData._id,
        titulo: canalData.titulo,
      },
    });
  }

  // 3️⃣ Associar IDs do agente e canal na reserva
  reservaData.agenteId = agenteSalvo ? agenteSalvo.idExterno : null;
  reservaData.canalId = canalSalvo ? canalSalvo.id : null;

  // 4️⃣ Criar/Atualizar a Reserva no Banco de Dados
  const reservaSalva = await prisma.reserva.upsert({
    where: { idExterno: reservaData.idExterno },
    update: reservaData,
    create: reservaData,
  });

  // 5️⃣ Criar/Atualizar as Taxas de Reserva
  const taxasReservas = transformTaxasReserva(payload, reservaSalva.id);
  if (taxasReservas.length > 0) {
    await prisma.taxaReserva.createMany({
      data: taxasReservas,
      skipDuplicates: true, // Evita duplicações no banco
    });
  }

  return reservaSalva;
};
*/