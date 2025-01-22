import prisma from '../../../config/database';
import { ReservaData, HospedeDetalhado, AgenteDetalhado } from '../stays.types';

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
