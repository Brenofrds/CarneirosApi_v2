import prisma from '../../../config/database';
import { ReservaData, HospedeDetalhado, AgenteDetalhado, ImovelDetalhado, CondominioDetalhado } from '../stays.types';

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


/**
 * Salva ou atualiza os dados do condomínio no banco de dados.
 * @param condominio - Detalhes do condomínio a serem salvos.
 * @returns O registro do condomínio salvo ou atualizado.
 */
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
