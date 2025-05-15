import prisma from '../../../config/database';
import { ReservaData, HospedeDetalhado, AgenteDetalhado, ImovelDetalhado, CondominioDetalhado, TaxaReservaDetalhada, CanalDetalhado, BloqueioDetalhado } from '../stays.types';
import { registrarErroJestor } from "../../database/erro.service"; // Importa a função que salva erros
import { sincronizarReserva } from "../../jestor/services/reservas.service";
import { sincronizarImovel } from "../../jestor/services/imoveis.service";
import { sincronizarHospede } from '../../jestor/services/hospedes.service';
import { sincronizarCondominio } from '../../jestor/services/condominios.service';
import { sincronizarProprietario } from '../../jestor/services/proprietarios.service';
import { sincronizarTaxaReserva } from '../../jestor/services/taxasReservas.service';
import { sincronizarBloqueio } from '../../jestor/services/bloqueios.service';
import { sincronizarCanal } from '../../jestor/services/canais.service';
import { sincronizarAgente } from '../../jestor/services/agentes.service';


import { logDebug } from '../../../utils/logger';

export async function salvarReserva(reserva: ReservaData) {

  const { agenteIdJestor, canalIdJestor, imovelIdJestor, ...dadosParaSalvar } = reserva;

  // 🔹 Busca a reserva existente no banco de dados pelo localizador
  const reservaExistente = await prisma.reserva.findUnique({
    where: { localizador: reserva.localizador },
  });

  // 🔍 Normaliza valores antes da comparação
  const normalizarTexto = (texto: string | null | undefined) => texto?.trim().toLowerCase() || '';
  const normalizarNumero = (num: number | null | undefined) => (num === undefined ? null : num);

  let jestorIdAtualizado: number | null = reservaExistente?.jestorId ?? null;

  // 🔍 Verifica se há diferenças
  const precisaAtualizar =
    !reservaExistente ||
    normalizarTexto(reservaExistente.idExterno) !== normalizarTexto(reserva.idExterno) ||
    reservaExistente.dataDaCriacao !== reserva.dataDaCriacao ||
    reservaExistente.checkIn !== reserva.checkIn ||
    reservaExistente.horaCheckIn !== reserva.horaCheckIn ||
    reservaExistente.checkOut !== reserva.checkOut ||
    reservaExistente.horaCheckOut !== reserva.horaCheckOut ||
    reservaExistente.quantidadeHospedes !== reserva.quantidadeHospedes ||
    reservaExistente.quantidadeAdultos !== reserva.quantidadeAdultos ||
    reservaExistente.quantidadeCriancas !== reserva.quantidadeCriancas ||
    reservaExistente.quantidadeInfantil !== reserva.quantidadeInfantil ||
    normalizarTexto(reservaExistente.moeda) !== normalizarTexto(reserva.moeda) ||
    reservaExistente.valorTotal !== reserva.valorTotal ||
    reservaExistente.totalPago !== reserva.totalPago ||
    reservaExistente.pendenteQuitacao !== reserva.pendenteQuitacao ||
    reservaExistente.totalTaxasExtras !== reserva.totalTaxasExtras ||
    reservaExistente.quantidadeDiarias !== reserva.quantidadeDiarias ||
    normalizarTexto(reservaExistente.partnerCode) !== normalizarTexto(reserva.partnerCode) ||
    normalizarTexto(reservaExistente.linkStays) !== normalizarTexto(reserva.linkStays) ||
    normalizarTexto(reservaExistente.idImovelStays) !== normalizarTexto(reserva.idImovelStays) ||
    normalizarNumero(reservaExistente.imovelId) !== normalizarNumero(reserva.imovelId) ||
    normalizarNumero(reservaExistente.imovelIdJestor) !== normalizarNumero(imovelIdJestor) ||
    normalizarNumero(reservaExistente.canalId) !== normalizarNumero(reserva.canalId) ||
    normalizarNumero(reservaExistente.agenteId) !== normalizarNumero(reserva.agenteId) ||
    normalizarTexto(reservaExistente.origem) !== normalizarTexto(reserva.origem) ||
    normalizarTexto(reservaExistente.status) !== normalizarTexto(reserva.status) ||
    normalizarTexto(reservaExistente.condominio) !== normalizarTexto(reserva.condominio) ||
    normalizarTexto(reservaExistente.regiao) !== normalizarTexto(reserva.regiao) ||
    normalizarTexto(reservaExistente.imovelOficialSku) !== normalizarTexto(reserva.imovelOficialSku) ||
    normalizarTexto(reservaExistente.observacao) !== normalizarTexto(reserva.observacao) ||
    reservaExistente.jestorId === null || reservaExistente.jestorId === undefined;

  if (!precisaAtualizar) {
    logDebug('Reserva', `Nenhuma mudança detectada para reserva ${reserva.idExterno}. Nenhuma atualização no banco foi realizada.`);
    logDebug('Reserva', `Status de sincronização atual no banco: ${reservaExistente?.sincronizadoNoJestor}`);

    if (reservaExistente && !reservaExistente.sincronizadoNoJestor) {
      try {
        logDebug('Reserva', `🔄 Sincronizando reserva ${reserva.idExterno} no Jestor.`);
        
        jestorIdAtualizado = await sincronizarReserva(reservaExistente, agenteIdJestor ?? undefined, canalIdJestor ?? undefined, imovelIdJestor ?? undefined);

        // 👇 Atualiza o campo jestorId após sincronização
        if (jestorIdAtualizado) {
          await prisma.reserva.update({
            where: { id: reservaExistente.id },
            data: {
              jestorId: jestorIdAtualizado,
              sincronizadoNoJestor: true,
            },
          });
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao sincronizar reserva ${reserva.idExterno} com Jestor: ${errorMessage}`);
        await registrarErroJestor('reserva', reservaExistente.id.toString(), errorMessage);
      }
    }

    return {
      id: reservaExistente!.id,
      jestorId: jestorIdAtualizado ?? null,
    };
  }

  // ✅ Atualiza ou cria a reserva no banco
  logDebug('Reserva', `🚨 Atualizando reserva ${reserva.idExterno} no banco.`);

  const reservaSalva = await prisma.reserva.upsert({
    where: { localizador: reserva.localizador },
    update: {
      ...dadosParaSalvar,
      imovelId: reserva.imovelId ?? null,
      agenteId: reserva.agenteId,
      canalId: reserva.canalId,
      imovelIdJestor: imovelIdJestor ?? null,
      sincronizadoNoJestor: false,
    },
    create: {
      ...dadosParaSalvar,
      imovelId: reserva.imovelId ?? null,
      agenteId: reserva.agenteId,
      canalId: reserva.canalId,
      imovelIdJestor: imovelIdJestor ?? null,
      sincronizadoNoJestor: false,
    },
  });

  try {

    jestorIdAtualizado = await sincronizarReserva(reservaSalva, agenteIdJestor ?? undefined, canalIdJestor ?? undefined, imovelIdJestor ?? undefined);

    // 👇 Atualiza o campo jestorId após sincronização
    if (jestorIdAtualizado) {
      await prisma.reserva.update({
        where: { id: reservaSalva.id },
        data: {
          jestorId: jestorIdAtualizado,
          sincronizadoNoJestor: true,
        },
      });
    }

  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';
    logDebug('Erro', `❌ Erro ao sincronizar reserva ${reservaSalva.idExterno} com Jestor: ${errorMessage}`);
    await registrarErroJestor('reserva', reservaSalva.id.toString(), errorMessage);
  }

  return {
    id: reservaSalva.id,
    jestorId: jestorIdAtualizado ?? null,
  };
}


export async function salvarImovel(imovel: ImovelDetalhado, condominioIdJestor?: number): Promise<{id: number, sku: string | null, jestorId: number | null}> {
  const imovelExistente = await prisma.imovel.findUnique({
    where: { idExterno: imovel._id },
  });

  let proprietarioId: number | null = null;
  let proprietarioIdJestor: number | null = null;

  if (imovel.owner) {
    const proprietarioSalvo = await salvarProprietario(imovel.owner.nome, imovel.owner.telefone);
    proprietarioId = proprietarioSalvo.id;
    proprietarioIdJestor = proprietarioSalvo.jestorId;
  }

  let jestorIdAtualizado: number | null = imovelExistente?.jestorId ?? null;

  const normalizarTexto = (texto: string | null | undefined) => texto?.trim().toLowerCase() || '';
  const normalizarNumero = (num: number | null | undefined) => (num === undefined ? null : num);

  const precisaAtualizar =
    !imovelExistente ||
    normalizarTexto(imovelExistente.idStays) !== normalizarTexto(imovel.id) ||
    normalizarTexto(imovelExistente.sku) !== normalizarTexto(imovel.internalName) ||
    normalizarTexto(imovelExistente.status) !== normalizarTexto(imovel.status) ||
    normalizarTexto(imovelExistente.idCondominioStays) !== normalizarTexto(imovel._idproperty) ||
    normalizarTexto(imovelExistente.regiao) !== normalizarTexto(imovel.regiao) ||
    normalizarNumero(imovelExistente.proprietarioId) !== normalizarNumero(proprietarioId) ||
    normalizarNumero(imovelExistente.condominioIdJestor) !== normalizarNumero(condominioIdJestor) ||
    imovelExistente.jestorId === null || imovelExistente.jestorId === undefined;

  if (!precisaAtualizar) {
    logDebug('Imovel', `Nenhuma mudança detectada para imóvel ${imovel._id}. Nenhuma atualização no banco foi realizada.`);

    if (imovelExistente && !imovelExistente.sincronizadoNoJestor) {
      try {
        logDebug('Imovel', `🔄 Sincronizando imóvel ${imovel._id} no Jestor.`);

        jestorIdAtualizado = await sincronizarImovel(imovelExistente, condominioIdJestor, proprietarioIdJestor ?? undefined);

        if (jestorIdAtualizado) {
          await prisma.imovel.update({
            where: { id: imovelExistente.id },
            data: {
              jestorId: jestorIdAtualizado,
              condominioIdJestor: condominioIdJestor ?? null,
              sincronizadoNoJestor: true,
            },
          });
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao sincronizar imóvel ${imovel._id} com Jestor: ${errorMessage}`);
        await registrarErroJestor('imovel', imovelExistente.id.toString(), errorMessage);
      }
    }

    return {
      id: imovelExistente!.id,
      sku: imovelExistente!.sku ?? null,
      jestorId: jestorIdAtualizado ?? null,
    };
  }

  logDebug('Imovel', `🚨 Atualizando imóvel ${imovel._id} no banco.`);

  const imovelSalvo = await prisma.imovel.upsert({
    where: { idExterno: imovel._id },
    update: {
      idStays: imovel.id,
      sku: imovel.internalName,
      status: imovel.status,
      idCondominioStays: imovel._idproperty || null,
      condominioIdJestor: condominioIdJestor ?? null,
      proprietarioId,
      regiao: imovel.regiao || null, // ✅ NOVO
      sincronizadoNoJestor: false,
    },
    create: {
      idExterno: imovel._id,
      idStays: imovel.id,
      sku: imovel.internalName,
      status: imovel.status,
      idCondominioStays: imovel._idproperty || null,
      condominioIdJestor: condominioIdJestor ?? null,
      proprietarioId,
      regiao: imovel.regiao || null, // ✅ NOVO
      sincronizadoNoJestor: false,
    },
  });

  try {
    jestorIdAtualizado = await sincronizarImovel(imovelSalvo, condominioIdJestor, proprietarioIdJestor ?? undefined);

    if (jestorIdAtualizado) {
      await prisma.imovel.update({
        where: { id: imovelSalvo.id },
        data: {
          jestorId: jestorIdAtualizado,
          condominioIdJestor: condominioIdJestor ?? null,
          sincronizadoNoJestor: true,
        },
      });
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';
    logDebug('Erro', `❌ Erro ao sincronizar imóvel ${imovelSalvo.idExterno} com Jestor: ${errorMessage}`);
    await registrarErroJestor('imovel', imovelSalvo.id.toString(), errorMessage);
  }

  return {
    id: imovelSalvo.id,
    sku: imovelSalvo.sku ?? null,
    jestorId: jestorIdAtualizado ?? null,
  };
}


export async function salvarHospede(hospede: HospedeDetalhado | null, reservaId: number, reservaIdJestor?: number) {
  if (!hospede) return;

  // 🔍 Busca o hóspede no banco de dados pelo ID externo
  const hospedeExistente = await prisma.hospede.findUnique({
    where: { idExterno: hospede._id },
  });

  // 🔍 Normaliza valores antes da comparação
  const normalizarTexto = (texto: string | null | undefined) => texto?.trim().toLowerCase() || '';
  const normalizarTelefone = (telefone: string | null | undefined) => telefone || '';
  const normalizarNumero = (num: number | null | undefined) => (num === undefined ? null : num);

  // 🔍 Verifica se há diferenças
  const precisaAtualizar =
    !hospedeExistente ||
    normalizarTexto(hospedeExistente.nomeCompleto) !== normalizarTexto(hospede.name) ||
    normalizarTexto(hospedeExistente.email || '') !== normalizarTexto(hospede.email || '') ||
    (hospedeExistente.dataDeNascimento || '') !== (hospede.birthDate || '') ||
    normalizarTelefone(hospedeExistente.telefone) !== normalizarTelefone(hospede.phones?.[0]?.iso) ||
    (hospedeExistente.cpf || '') !== (hospede.documents?.find((doc) => doc.type === 'cpf')?.numb || '') ||
    (hospedeExistente.documento || '') !== (hospede.documents?.find((doc) => doc.type === 'id')?.numb || '') ||
    normalizarNumero(hospedeExistente.idade) !== normalizarNumero(hospede.idade) ||
    normalizarNumero(hospedeExistente.reservaIdJestor) !== normalizarNumero(reservaIdJestor);
    
  if (!precisaAtualizar) {
    logDebug('Hospede', `Nenhuma mudança detectada para hóspede ${hospede._id}. Nenhuma atualização no banco foi realizada.`);

    if (hospedeExistente && !hospedeExistente.sincronizadoNoJestor) {
      try {
        logDebug('Hospede', `🔄 Sincronizando hóspede ${hospede._id} no Jestor.`);
        await sincronizarHospede(hospedeExistente, reservaIdJestor);
        await prisma.hospede.update({
          where: { id: hospedeExistente.id },
          data: { sincronizadoNoJestor: true },
        });
      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao sincronizar hóspede ${hospede._id} com Jestor: ${errorMessage}`);
        await registrarErroJestor('hospede', hospedeExistente.id.toString(), errorMessage);
      }
    }

    return hospedeExistente;
  }

  // ✅ Atualiza ou cria o hóspede no banco
  logDebug('Hospede', `🚨 Atualizando hóspede ${hospede._id} no banco.`);
  
  const hospedeSalvo = await prisma.hospede.upsert({
    where: { idExterno: hospede._id },
    update: {
      nomeCompleto: hospede.name.trim(),
      email: hospede.email?.trim() || null,
      dataDeNascimento: hospede.birthDate || null,
      idade: normalizarNumero(hospede.idade),
      telefone: hospede.phones?.[0]?.iso || null,
      cpf: hospede.documents?.find((doc) => doc.type === 'cpf')?.numb || null,
      documento: hospede.documents?.find((doc) => doc.type === 'id')?.numb || null,
      reservaId,
      reservaIdJestor: reservaIdJestor ?? null,
      sincronizadoNoJestor: false,
    },
    create: {
      idExterno: hospede._id,
      nomeCompleto: hospede.name.trim(),
      email: hospede.email?.trim() || null,
      dataDeNascimento: hospede.birthDate || null,
      idade: normalizarNumero(hospede.idade),
      telefone: hospede.phones?.[0]?.iso || null,
      cpf: hospede.documents?.find((doc) => doc.type === 'cpf')?.numb || null,
      documento: hospede.documents?.find((doc) => doc.type === 'id')?.numb || null,
      reservaId,
      reservaIdJestor: reservaIdJestor ?? null,
      sincronizadoNoJestor: false,
    },
  });

  try {

    await sincronizarHospede(hospedeSalvo, reservaIdJestor);

  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';
    logDebug('Erro', `❌ Erro ao sincronizar hóspede ${hospedeSalvo.idExterno} com Jestor: ${errorMessage}`);
    await registrarErroJestor('hospede', hospedeSalvo.id.toString(), errorMessage);
  }

  return hospedeSalvo;
}





/**
 * Salva ou atualiza as taxas de reserva no banco de dados e tenta sincronizá-las com o Jestor.
 * 
 * @param taxas - Array de taxas detalhadas a serem salvas ou atualizadas.
 */
export async function salvarTaxasReserva(taxas: TaxaReservaDetalhada[], reservaIdJestor?: number) {
  for (const taxa of taxas) {
    try {
      // 🔍 Valida se a taxa possui um nome válido
      if (!taxa.name || typeof taxa.name !== 'string') {
        logDebug('Aviso', `⚠️ Taxa inválida encontrada: ${JSON.stringify(taxa)}`);
        continue;
      }

      // 🔍 Busca a taxa existente no banco pelo par (reservaId, name)
      const taxaExistente = await prisma.taxaReserva.findUnique({
        where: { reservaId_name: { reservaId: taxa.reservaId, name: taxa.name } },
      });

      // 🔍 Normaliza valores antes da comparação
      const normalizarNumero = (num: number | null | undefined) => (num === undefined ? null : num);

      // 🔍 Verifica se há diferenças
      const precisaAtualizar = 
        !taxaExistente || 
        normalizarNumero(taxaExistente.valor) !== normalizarNumero(taxa.valor);

      if (!precisaAtualizar) {
        logDebug('TaxaReserva', `Nenhuma mudança detectada para taxa "${taxa.name}" da reserva ${taxa.reservaId}. Nenhuma atualização no banco foi realizada.`);

        if (taxaExistente && !taxaExistente.sincronizadoNoJestor) {
          try {
            logDebug('TaxaReserva', `🔄 Sincronizando taxa "${taxa.name}" da reserva ${taxa.reservaId} no Jestor.`);
            await sincronizarTaxaReserva(taxaExistente, reservaIdJestor);

            await prisma.taxaReserva.update({
              where: { id: taxaExistente.id },
              data: { sincronizadoNoJestor: true }, 
            });

          } catch (error: any) {
            const errorMessage = error.message || 'Erro desconhecido';
            logDebug('Erro', `❌ Erro ao sincronizar taxa "${taxa.name}" da reserva ${taxa.reservaId} com Jestor: ${errorMessage}`);
            await registrarErroJestor('taxaReserva', taxa.reservaId.toString(), errorMessage);
          }
        }

        continue;
      }

      // ✅ Atualiza ou cria a taxa no banco
      logDebug('TaxaReserva', `🚨 Atualizando taxa "${taxa.name}" da reserva ${taxa.reservaId} no banco.`);

      const taxaSalva = await prisma.taxaReserva.upsert({
        where: { reservaId_name: { reservaId: taxa.reservaId, name: taxa.name } },
        update: {
          valor: taxa.valor,
          sincronizadoNoJestor: false, 
        },
        create: {
          reservaId: taxa.reservaId,
          name: taxa.name,
          valor: taxa.valor,
          sincronizadoNoJestor: false,
        },
      });

      try {
        // 🚀 Sincroniza a taxa com o Jestor
        await sincronizarTaxaReserva(taxaSalva, reservaIdJestor);

        await prisma.taxaReserva.update({
          where: { id: taxaSalva.id },
          data: { sincronizadoNoJestor: true }, 
        });

      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao sincronizar taxa "${taxa.name}" da reserva ${taxa.reservaId} com Jestor: ${errorMessage}`);
        await registrarErroJestor('taxaReserva', taxa.reservaId.toString(), errorMessage);
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      logDebug('Erro', `❌ Erro ao processar taxa "${taxa.name}" da reserva ${taxa.reservaId}: ${errorMessage}`);
    }
  }
}




/**
 * Salva ou atualiza um condomínio no banco de dados e tenta sincronizá-lo com o Jestor.
 * 
 * @param condominio - Dados detalhados do condomínio a serem salvos ou atualizados.
 * @returns O condomínio salvo no banco de dados.
 */
export async function salvarCondominio(condominio: CondominioDetalhado): Promise<{ id: number, sku: string | null, regiao: string | null, titulo: string | null, jestorId: number | null }> {
  // 🔹 Busca o condomínio no banco de dados pelo ID externo (_id)
  const condominioExistente = await prisma.condominio.findUnique({
    where: { idExterno: condominio._id },
  });

  const normalizarTexto = (texto: string | null | undefined) => texto?.trim().toLowerCase() || '';

  const precisaAtualizar =
    !condominioExistente ||
    normalizarTexto(condominioExistente.idStays) !== normalizarTexto(condominio.id) ||
    normalizarTexto(condominioExistente.sku) !== normalizarTexto(condominio.internalName) ||
    normalizarTexto(condominioExistente.regiao) !== normalizarTexto(condominio.regiao) ||
    normalizarTexto(condominioExistente.status) !== normalizarTexto(condominio.status) ||
    normalizarTexto(condominioExistente.titulo) !== normalizarTexto(condominio.titulo) ||
    condominioExistente.jestorId === null || condominioExistente.jestorId === undefined;

  let jestorIdAtualizado: number | null = condominioExistente?.jestorId ?? null;

  if (!precisaAtualizar) {
    logDebug('Condominio', `Nenhuma mudança detectada para condomínio ${condominio._id}. Nenhuma atualização no banco foi realizada.`);

    if (condominioExistente && !condominioExistente.sincronizadoNoJestor) {
      try {
        logDebug('Condominio', `🔄 Sincronizando condomínio ${condominio._id} no Jestor.`);
        jestorIdAtualizado = await sincronizarCondominio(condominioExistente);

        await prisma.condominio.update({
          where: { id: condominioExistente.id },
          data: {
            jestorId: jestorIdAtualizado ?? condominioExistente.jestorId,
            sincronizadoNoJestor: true,
          },
        });

      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao sincronizar condomínio ${condominio._id} com Jestor: ${errorMessage}`);
        await registrarErroJestor('condominio', condominioExistente.id.toString(), errorMessage);
      }
    }

    return {
      id: condominioExistente!.id,
      sku: condominioExistente!.sku ?? null,
      regiao: condominioExistente!.regiao ?? null,
      titulo: condominioExistente!.titulo ?? null,
      jestorId: jestorIdAtualizado ?? null,
    };
  }

  logDebug('Condominio', `🚨 Atualizando condomínio ${condominio._id} no banco.`);

  const condominioSalvo = await prisma.condominio.upsert({
    where: { idExterno: condominio._id },
    update: {
      idStays: condominio.id,
      sku: condominio.internalName,
      regiao: condominio.regiao,
      status: condominio.status,
      titulo: condominio.titulo,
      sincronizadoNoJestor: false,
    },
    create: {
      idExterno: condominio._id,
      idStays: condominio.id,
      sku: condominio.internalName,
      regiao: condominio.regiao,
      status: condominio.status,
      titulo: condominio.titulo,
      sincronizadoNoJestor: false,
    },
  });

  try {
    jestorIdAtualizado = await sincronizarCondominio(condominioSalvo);

    if (jestorIdAtualizado) {
      await prisma.condominio.update({
        where: { id: condominioSalvo.id },
        data: {
          jestorId: jestorIdAtualizado,
          sincronizadoNoJestor: true,
        },
      });
    }

  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';
    logDebug('Erro', `❌ Erro ao sincronizar condomínio ${condominioSalvo.idExterno} com Jestor: ${errorMessage}`);
    await registrarErroJestor('condominio', condominioSalvo.id.toString(), errorMessage);
  }

  return {
    id: condominioSalvo.id,
    sku: condominioSalvo.sku ?? null,
    regiao: condominioSalvo.regiao ?? null,
    titulo: condominioSalvo.titulo ?? null,
    jestorId: jestorIdAtualizado ?? null,
  };
}



/**
 * Salva ou atualiza um proprietário no banco de dados e tenta sincronizá-lo com o Jestor.
 * 
 * @param nome - Nome do proprietário a ser salvo ou atualizado.
 * @param telefone - Telefone do proprietário (opcional).
 * @returns O ID do proprietário salvo no banco de dados.
 */
export async function salvarProprietario(nome: string, telefone?: string): Promise<{id: number, jestorId: number | null}> {
  // 🔍 Normaliza valores antes da comparação
  const normalizarTexto = (texto: string | null | undefined) => texto?.trim().toLowerCase() || '';
  const normalizarTelefone = (telefone: string | null | undefined) => telefone || '';

  // 🔍 Busca o proprietário existente no banco pelo nome e telefone
  const proprietarioExistente = await prisma.proprietario.findFirst({
    where: { nome, telefone },
  });

  // 🔍 Verifica se há diferenças nos dados
  const precisaAtualizar =
    !proprietarioExistente ||
    normalizarTexto(proprietarioExistente.nome) !== normalizarTexto(nome) ||
    normalizarTelefone(proprietarioExistente.telefone) !== normalizarTelefone(telefone) ||
    proprietarioExistente.jestorId === null || proprietarioExistente.jestorId === undefined;

  let jestorIdAtualizado: number | null = proprietarioExistente?.jestorId ?? null;

  if (!precisaAtualizar) {
    logDebug('Proprietario', `Nenhuma mudança detectada para proprietário "${nome}". Nenhuma atualização no banco foi realizada.`);

    if (proprietarioExistente && !proprietarioExistente.sincronizadoNoJestor) {
      try {
        logDebug('Proprietario', `🔄 Sincronizando proprietário "${nome}" no Jestor.`);
        jestorIdAtualizado = await sincronizarProprietario(proprietarioExistente);

        await prisma.proprietario.update({
          where: { id: proprietarioExistente.id },
          data: {
            jestorId: jestorIdAtualizado ?? proprietarioExistente.jestorId,
            sincronizadoNoJestor: true,
          },
        });

      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao sincronizar proprietário "${nome}" com Jestor: ${errorMessage}`);
        await registrarErroJestor('proprietario', proprietarioExistente.id.toString(), errorMessage);
      }
    }

    return {
      id: proprietarioExistente!.id,
      jestorId: jestorIdAtualizado ?? null,
    };
  }

  // ✅ Atualiza ou cria o proprietário no banco de dados
  logDebug('Proprietario', `🚨 Atualizando proprietário "${nome}" no banco.`);

  const proprietarioSalvo = await prisma.proprietario.upsert({
    where: { id: proprietarioExistente?.id || 0 },
    update: {
      nome,
      telefone: telefone || null,
      sincronizadoNoJestor: false, // Marcamos como não sincronizado até que a sincronização ocorra
    },
    create: {
      nome,
      telefone: telefone || null,
      sincronizadoNoJestor: false,
    },
  });

  try {
    jestorIdAtualizado = await sincronizarProprietario(proprietarioSalvo);

    if (jestorIdAtualizado) {
      await prisma.proprietario.update({
        where: { id: proprietarioSalvo.id },
        data: {
          jestorId: jestorIdAtualizado,
          sincronizadoNoJestor: true,
        },
      });
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';
    logDebug('Erro', `❌ Erro ao sincronizar proprietário "${nome}" com Jestor: ${errorMessage}`);
    await registrarErroJestor('proprietario', proprietarioSalvo.id.toString(), errorMessage);
  }

  return {
    id: proprietarioSalvo.id,
    jestorId: jestorIdAtualizado ?? null,
  };
}


/**
 * Salva ou atualiza um bloqueio no banco de dados e tenta sincronizá-lo com o Jestor.
 * 
 * @param bloqueio - Dados detalhados do bloqueio a serem salvos ou atualizados.
 * @returns O bloqueio salvo no banco de dados.
 */
export async function salvarBloqueio(bloqueio: BloqueioDetalhado) {
  try {
    console.log(`📌 Salvando bloqueio: ${bloqueio._id}`);

    const normalizarTexto = (texto: string | null | undefined) => texto?.trim().toLowerCase() || '';
    const normalizarNumero = (num: number | null | undefined) => (num === undefined ? null : num);

    const { imovelIdJestor, ...dadosParaSalvar } = bloqueio; // 👈 separa imovelIdJestor

    // 🔹 Verifica se o bloqueio já existe no banco de dados pelo ID externo (_id)
    const bloqueioExistente = await prisma.bloqueio.findUnique({
      where: { idExterno: bloqueio._id },
    });

    let jestorIdAtualizado: number | null = bloqueioExistente?.jestorId ?? null;

    // 🔹 Define se a atualização é necessária comparando os valores existentes com os novos
    const precisaAtualizar =
      !bloqueioExistente ||
      bloqueioExistente.localizador !== bloqueio.name ||
      bloqueioExistente.checkIn !== bloqueio.checkIn ||
      bloqueioExistente.checkOut !== bloqueio.checkOut ||
      bloqueioExistente.horaCheckIn !== (bloqueio.horaCheckIn ?? null) ||
      bloqueioExistente.horaCheckOut !== (bloqueio.horaCheckOut ?? null) ||
      bloqueioExistente.notaInterna !== (bloqueio.notaInterna || 'Sem nota interna') ||
      normalizarNumero(bloqueioExistente.imovelId) !== normalizarNumero(bloqueio.imovelId) ||
      normalizarNumero(bloqueioExistente.imovelIdJestor) !== normalizarNumero(imovelIdJestor) ||
      normalizarTexto(bloqueioExistente.status) !== normalizarTexto(bloqueio.status) ||
      bloqueioExistente.jestorId === null || bloqueioExistente.jestorId === undefined;

      if (!precisaAtualizar) {
        logDebug('Bloqueio', `Nenhuma mudança detectada para bloqueio ${bloqueio._id}. Nenhuma atualização no banco foi realizada.`);
        logDebug('Bloqueio', `Status de sincronização atual no banco: ${bloqueioExistente?.sincronizadoNoJestor}`);
  
        if (bloqueioExistente && !bloqueioExistente.sincronizadoNoJestor) {
          try {
            logDebug('Bloqueio', `🔄 Sincronizando bloqueio ${bloqueio._id} no Jestor.`);
            await sincronizarBloqueio(bloqueioExistente, imovelIdJestor ?? undefined);
  
            await prisma.bloqueio.update({
              where: { id: bloqueioExistente.id },
              data: {
                jestorId: jestorIdAtualizado,
                sincronizadoNoJestor: true,
              },
            });
          } catch (error: any) {
            const errorMessage = error.message || 'Erro desconhecido';
            logDebug('Erro', `❌ Erro ao sincronizar bloqueio ${bloqueioExistente.idExterno} com Jestor: ${errorMessage}`);
            await registrarErroJestor('bloqueio', bloqueioExistente.id.toString(), errorMessage);
          }
        }
  
        return bloqueioExistente;
      }

    // ✅ Atualiza ou cria o bloqueio no banco
    logDebug('Bloqueio', `🚨 Atualizando bloqueio ${bloqueio._id} no banco.`);

    // 🔹 Realiza o upsert do bloqueio no banco de dados
    const bloqueioSalvo = await prisma.bloqueio.upsert({
      where: { idExterno: bloqueio._id },
      update: {
        localizador: bloqueio.name,
        checkIn: bloqueio.checkIn,
        checkOut: bloqueio.checkOut,
        horaCheckIn: bloqueio.horaCheckIn ?? null,
        horaCheckOut: bloqueio.horaCheckOut ?? null,
        notaInterna: bloqueio.notaInterna || 'Sem nota interna',
        imovelId: bloqueio.imovelId ?? null,
        imovelIdJestor: imovelIdJestor ?? null,
        status: bloqueio.status,
        jestorId: jestorIdAtualizado,
        sincronizadoNoJestor: false,
      },
      create: {
        idExterno: bloqueio._id,
        localizador: bloqueio.name,
        checkIn: bloqueio.checkIn,
        checkOut: bloqueio.checkOut,
        horaCheckIn: bloqueio.horaCheckIn ?? null,
        horaCheckOut: bloqueio.horaCheckOut ?? null,
        notaInterna: bloqueio.notaInterna || 'Sem nota interna',
        imovelId: bloqueio.imovelId ?? null,
        imovelIdJestor: imovelIdJestor ?? null,
        status: bloqueio.status,
        jestorId: jestorIdAtualizado,
        sincronizadoNoJestor: false,
      },
    });

    try {
      // 🚀 Tenta sincronizar o bloqueio com o Jestor
      await sincronizarBloqueio(bloqueioSalvo, imovelIdJestor ?? undefined); // 👈 envia imovelIdJestor

      // ✅ Atualiza o campo `sincronizadoNoJestor` se a sincronização for bem-sucedida
      if (jestorIdAtualizado) {
        await prisma.bloqueio.update({
          where: { id: bloqueioSalvo.id },
          data: {
            jestorId: jestorIdAtualizado,
            sincronizadoNoJestor: true,
          },
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      logDebug('Erro', `❌ Erro ao sincronizar bloqueio ${bloqueioSalvo.idExterno} com Jestor: ${errorMessage}`);
      await registrarErroJestor('bloqueio', bloqueioSalvo.id.toString(), errorMessage);
    }

    return bloqueioSalvo;

  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';
    logDebug('Erro', `❌ Erro ao salvar bloqueio ${bloqueio._id}: ${errorMessage}`);
    throw new Error('Erro ao salvar bloqueio');
  }
}

/**
 * Salva ou atualiza um canal no banco de dados e tenta sincronizá-lo com o Jestor.
 * 
 * @param canal - Dados detalhados do canal a serem salvos ou atualizados.
 * @returns O ID do canal salvo no banco de dados.
 */
export async function salvarCanal(canal: CanalDetalhado): Promise<{ id: number, jestorId: number | null }> {
  const normalizarTexto = (texto: string | null | undefined) => texto?.trim().toLowerCase() || '';

  const canalExistente = await prisma.canal.findUnique({
    where: { idExterno: canal._id },
  });

  const precisaAtualizar =
    !canalExistente ||
    normalizarTexto(canalExistente.titulo) !== normalizarTexto(canal.titulo);

  let jestorIdAtualizado: number | null = canalExistente?.jestorId ?? null;

  if (!precisaAtualizar) {
    logDebug('Canal', `Nenhuma mudança detectada para canal ${canal._id}. Nenhuma atualização no banco foi realizada.`);

    if (canalExistente && !canalExistente.sincronizadoNoJestor) {
      try {
        logDebug('Canal', `🔄 Sincronizando canal ${canal._id} no Jestor.`);
        jestorIdAtualizado = await sincronizarCanal(canalExistente);
        logDebug('Canal', `Codigo interno jestor ${jestorIdAtualizado}.`);


        await prisma.canal.update({
          where: { id: canalExistente.id },
          data: {
            jestorId: jestorIdAtualizado,
            sincronizadoNoJestor: true,
          },
        });
      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao sincronizar canal ${canal._id} com Jestor: ${errorMessage}`);
        await registrarErroJestor('canal', canalExistente.id.toString(), errorMessage);
      }
    }

    return { id: canalExistente!.id, jestorId: jestorIdAtualizado };
  }

  logDebug('Canal', `🚨 Atualizando canal ${canal._id} no banco.`);

  const canalSalvo = await prisma.canal.upsert({
    where: { idExterno: canal._id },
    update: {
      titulo: canal.titulo,
      sincronizadoNoJestor: false,
    },
    create: {
      idExterno: canal._id,
      titulo: canal.titulo,
      sincronizadoNoJestor: false,
    },
  });

  try {
    jestorIdAtualizado = await sincronizarCanal(canalSalvo);

    logDebug('Canal', `Codigo interno jestor ${jestorIdAtualizado}.`);


    await prisma.canal.update({
      where: { id: canalSalvo.id },
      data: {
        jestorId: jestorIdAtualizado,
        sincronizadoNoJestor: true,
      },
    });

    logDebug('Canal', `✅ Canal ${canal._id} sincronizado com sucesso no Jestor.`);
  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';
    logDebug('Erro', `❌ Erro ao sincronizar canal ${canalSalvo.idExterno} com Jestor: ${errorMessage}`);
    await registrarErroJestor('canal', canalSalvo.id.toString(), errorMessage);
  }

  return { id: canalSalvo.id, jestorId: jestorIdAtualizado };
}



export async function obterOuCriarCanalReservaDireta(): Promise<{ id: number, jestorId: number | null }> {
  const idExternoReservaDireta = 'reserva_direta';

  let canalExistente = await prisma.canal.findUnique({
    where: { idExterno: idExternoReservaDireta },
  });

  if (canalExistente) {
    return {
      id: canalExistente.id,
      jestorId: canalExistente.jestorId ?? null,
    };
  }

  const canalSalvo = await prisma.canal.create({
    data: {
      idExterno: idExternoReservaDireta,
      titulo: 'Reserva Direta',
      sincronizadoNoJestor: false,
    },
  });

  try {
    const jestorId = await sincronizarCanal(canalSalvo);

    await prisma.canal.update({
      where: { id: canalSalvo.id },
      data: {
        jestorId,
        sincronizadoNoJestor: true,
      },
    });

    return {
      id: canalSalvo.id,
      jestorId,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';
    logDebug('Erro', `❌ Erro ao sincronizar canal Reserva Direta: ${errorMessage}`);
    await registrarErroJestor('canal', canalSalvo.id.toString(), errorMessage);
    return {
      id: canalSalvo.id,
      jestorId: null,
    };
  }
}




/**
 * Salva ou atualiza um agente no banco de dados e sincroniza com o Jestor,
 * mantendo o campo jestorId atualizado.
 * 
 * @param agente - Dados detalhados do agente a serem salvos ou atualizados.
 * @returns O ID do agente salvo no banco de dados.
 */
export async function salvarAgente(agente: AgenteDetalhado): Promise<{ id: number, jestorId: number | null }> {
  const normalizarTexto = (texto: string | null | undefined) => texto?.trim().toLowerCase() || '';

  const agenteExistente = await prisma.agente.findUnique({
    where: { idExterno: agente._id },
  });

  const precisaAtualizar =
    !agenteExistente ||
    normalizarTexto(agenteExistente.nome) !== normalizarTexto(agente.name);

  let jestorIdAtualizado: number | null = agenteExistente?.jestorId ?? null;

  // ✅ CASO NÃO precise atualizar os dados do banco local
  if (!precisaAtualizar) {
    logDebug('Agente', `Nenhuma mudança detectada para agente ${agente._id}. Nenhuma atualização no banco foi realizada.`);

    // 🔄 Mas ainda pode ser necessário sincronizar com o Jestor!
    if (agenteExistente && !agenteExistente.sincronizadoNoJestor) {
      try {
        logDebug('Agente', `🔄 Sincronizando agente ${agente._id} no Jestor.`);

        // ✅ Garantimos que agenteExistente não é null dentro deste bloco
        jestorIdAtualizado = await sincronizarAgente(agenteExistente);

        // Atualiza o jestorId e marca como sincronizado
        await prisma.agente.update({
          where: { id: agenteExistente.id },
          data: {
            jestorId: jestorIdAtualizado ?? agenteExistente.jestorId,
            sincronizadoNoJestor: true,
          },
        });

      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido';
        logDebug('Erro', `❌ Erro ao sincronizar agente ${agente._id} com Jestor: ${errorMessage}`);
        await registrarErroJestor('agente', agenteExistente.id.toString(), errorMessage);
      }
    }

    return { id: agenteExistente!.id, jestorId: jestorIdAtualizado ?? null };
  }

  // ✅ CASO precise atualizar ou criar o agente no banco local
  logDebug('Agente', `🚨 Atualizando agente ${agente._id} no banco.`);

  const agenteSalvo = await prisma.agente.upsert({
    where: { idExterno: agente._id },
    update: {
      nome: agente.name,
      sincronizadoNoJestor: false,
    },
    create: {
      idExterno: agente._id,
      nome: agente.name,
      sincronizadoNoJestor: false,
    },
  });

  try {
    logDebug('Agente', `🔄 Sincronizando agente ${agente._id} com o Jestor.`);

    jestorIdAtualizado = await sincronizarAgente(agenteSalvo);

    // Após sincronização, atualiza jestorId e marca como sincronizado
    if (jestorIdAtualizado) {
      await prisma.agente.update({
        where: { id: agenteSalvo.id },
        data: { jestorId: jestorIdAtualizado, sincronizadoNoJestor: true },
      });
    }

  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';
    logDebug('Erro', `❌ Erro ao sincronizar agente ${agenteSalvo.idExterno} com Jestor: ${errorMessage}`);
    await registrarErroJestor('agente', agenteSalvo.id.toString(), errorMessage);
  }

  return { id: agenteSalvo.id, jestorId: jestorIdAtualizado ?? null };
}


