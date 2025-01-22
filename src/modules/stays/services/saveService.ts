import prisma from '../../../config/database';
import { ReservaData, HospedeDetalhado, AgenteDetalhado, ImovelDetalhado } from '../stays.types';

export async function salvarReserva(reserva: ReservaData, agente: AgenteDetalhado | null) {
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

  return await prisma.reserva.upsert({
    where: { localizador: reserva.localizador },
    update: reserva,
    create: reserva,
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
        nacionalidade: hospede.nationality || null,
        fonte: hospede.clientSource,
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
        nacionalidade: hospede.nationality || null,
        fonte: hospede.clientSource,
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
    where: { idExterno: imovel._id }, // Verifica se o imóvel já existe pelo id externo
    update: {
      idStays: imovel.id,             // Atualiza o ID Stays
      sku: imovel.internalName,       // Atualiza o SKU (nome interno)
      status: imovel.status,          // Atualiza o status
    },
    create: {
      idExterno: imovel._id,          // Cria um novo registro com o id externo
      idStays: imovel.id,             // Preenche o ID Stays
      sku: imovel.internalName,       // Preenche o SKU (nome interno)
      status: imovel.status,          // Preenche o status
      sincronizadoNoJestor: false,    // Define o estado inicial de sincronização
    },
  });
}