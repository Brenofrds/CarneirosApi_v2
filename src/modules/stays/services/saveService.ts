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
  const reservaExistente = await prisma.reserva.findUnique({
    where: { localizador: reserva.localizador },
  });

  // 🔍 Verificar se precisa atualizar os dados da reserva
  const precisaAtualizar =
    !reservaExistente ||
    reservaExistente.idExterno !== reserva.idExterno ||
    reservaExistente.dataDaCriacao !== reserva.dataDaCriacao ||
    reservaExistente.checkIn !== reserva.checkIn ||
    reservaExistente.horaCheckIn !== reserva.horaCheckIn ||
    reservaExistente.checkOut !== reserva.checkOut ||
    reservaExistente.horaCheckOut !== reserva.horaCheckOut ||
    reservaExistente.quantidadeHospedes !== reserva.quantidadeHospedes ||
    reservaExistente.quantidadeAdultos !== reserva.quantidadeAdultos ||
    reservaExistente.quantidadeCriancas !== reserva.quantidadeCriancas ||
    reservaExistente.quantidadeInfantil !== reserva.quantidadeInfantil ||
    reservaExistente.moeda !== reserva.moeda ||
    reservaExistente.valorTotal !== reserva.valorTotal ||
    reservaExistente.totalPago !== reserva.totalPago ||
    reservaExistente.pendenteQuitacao !== reserva.pendenteQuitacao ||
    reservaExistente.totalTaxasExtras !== reserva.totalTaxasExtras ||
    reservaExistente.quantidadeDiarias !== reserva.quantidadeDiarias ||
    reservaExistente.partnerCode !== reserva.partnerCode ||
    reservaExistente.linkStays !== reserva.linkStays ||
    reservaExistente.idImovelStays !== reserva.idImovelStays ||
    reservaExistente.imovelId !== reserva.imovelId ||
    reservaExistente.canalId !== reserva.canalId ||
    reservaExistente.agenteId !== reserva.agenteId ||
    reservaExistente.origem !== reserva.origem ||
    reservaExistente.status !== reserva.status ||
    reservaExistente.condominio !== reserva.condominio ||
    reservaExistente.regiao !== reserva.regiao ||
    reservaExistente.imovelOficialSku !== reserva.imovelOficialSku ||
    reservaExistente.observacao !== reserva.observacao;

  const reservaSalva = await prisma.reserva.upsert({
    where: { localizador: reserva.localizador },
    update: {
      ...reserva,
      imovelId: reserva.imovelId ?? null,
      agenteId: reserva.agenteId,
      canalId: reserva.canalId,
      sincronizadoNoJestor: precisaAtualizar ? false : reservaExistente?.sincronizadoNoJestor,
    },
    create: {
      ...reserva,
      imovelId: reserva.imovelId ?? null,
      agenteId: reserva.agenteId,
      canalId: reserva.canalId,
      sincronizadoNoJestor: false,
    },
  });

  try {
    // 🚀 Tenta sincronizar com o Jestor imediatamente após salvar no banco
    await sincronizarReserva(reservaSalva);
    
    // ✅ Se deu certo, atualiza o campo `sincronizadoNoJestor`
    await prisma.reserva.update({
      where: { id: reservaSalva.id },
      data: { sincronizadoNoJestor: true },
    });

  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';

    logDebug('Erro', `❌ Erro ao sincronizar reserva ${reservaSalva.localizador} com Jestor: ${errorMessage}`);
    
    // 🔥 Salva o erro na tabela ErroSincronizacao
    await registrarErroJestor("reserva", reservaSalva.id.toString(), errorMessage);
  }

  return reservaSalva;
}


/**
 * Salva ou atualiza um hóspede no banco de dados e tenta sincronizá-lo com o Jestor.
 * 
 * @param hospede - Dados detalhados do hóspede a serem salvos ou atualizados.
 * @param reservaId - ID da reserva associada ao hóspede.
 * @returns O hóspede salvo no banco de dados.
 */
export async function salvarHospede(hospede: HospedeDetalhado | null, reservaId: number) {
  if (!hospede) return;

  // 🔍 Verifica se o hóspede já existe no banco pelo ID externo
  const hospedeExistente = await prisma.hospede.findUnique({
      where: { idExterno: hospede._id },
  });

  // 🔍 Define se a atualização é necessária comparando os dados existentes com os novos
  const precisaAtualizar =
      !hospedeExistente ||
      hospedeExistente.nomeCompleto !== hospede.name ||
      hospedeExistente.email !== hospede.email ||
      hospedeExistente.dataDeNascimento !== hospede.birthDate ||
      hospedeExistente.telefone !== hospede.phones?.[0]?.iso ||
      hospedeExistente.cpf !== hospede.documents?.find((doc) => doc.type === 'cpf')?.numb ||
      hospedeExistente.documento !== hospede.documents?.find((doc) => doc.type === 'id')?.numb ||
      hospedeExistente.idade !== hospede.idade; // ✅ Agora usamos a idade já calculada!

  // 🚀 Realiza o upsert do hóspede no banco de dados
  const hospedeSalvo = await prisma.hospede.upsert({
      where: { idExterno: hospede._id },
      update: {
          nomeCompleto: hospede.name,
          email: hospede.email,
          dataDeNascimento: hospede.birthDate || null,
          idade: hospede.idade, // ✅ Já vem preenchida corretamente
          telefone: hospede.phones?.[0]?.iso || null,
          cpf: hospede.documents?.find((doc) => doc.type === 'cpf')?.numb || null,
          documento: hospede.documents?.find((doc) => doc.type === 'id')?.numb || null,
          reservaId,
          sincronizadoNoJestor: precisaAtualizar ? false : hospedeExistente?.sincronizadoNoJestor,
      },
      create: {
          idExterno: hospede._id,
          nomeCompleto: hospede.name,
          email: hospede.email,
          dataDeNascimento: hospede.birthDate || null,
          idade: hospede.idade, // ✅ Sem necessidade de recálculo
          telefone: hospede.phones?.[0]?.iso || null,
          cpf: hospede.documents?.find((doc) => doc.type === 'cpf')?.numb || null,
          documento: hospede.documents?.find((doc) => doc.type === 'id')?.numb || null,
          reservaId,
          sincronizadoNoJestor: false,
      },
  });

  try {
      // 🚀 Tenta sincronizar o hóspede com o Jestor imediatamente após salvar no banco
      await sincronizarHospede(hospedeSalvo);

      // ✅ Atualiza o campo `sincronizadoNoJestor` caso a sincronização seja bem-sucedida
      await prisma.hospede.update({
          where: { id: hospedeSalvo.id },
          data: { sincronizadoNoJestor: true },
      });

  } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';

      logDebug('Erro', `❌ Erro ao sincronizar hóspede ${hospedeSalvo.nomeCompleto} com Jestor: ${errorMessage}`);
      
      // 🔥 Salva o erro na tabela ErroSincronizacao
      await registrarErroJestor('hospede', hospedeSalvo.id.toString(), errorMessage);
  }

  return hospedeSalvo;
}


/**
 * Salva ou atualiza um imóvel no banco de dados e tenta sincronizá-lo com o Jestor.
 * 
 * @param imovel - Dados detalhados do imóvel a serem salvos ou atualizados.
 * @returns O imóvel salvo no banco de dados.
 */
export async function salvarImovel(imovel: ImovelDetalhado) {
  // 🔹 Verifica se o imóvel já existe no banco pelo ID externo (_id)
  const imovelExistente = await prisma.imovel.findUnique({
    where: { idExterno: imovel._id },
  });

  // 🔹 Salva o proprietário, se existir
  let proprietarioId: number | null = null;
  if (imovel.owner) {
    proprietarioId = await salvarProprietario(imovel.owner.nome, imovel.owner.telefone);
  }

  // 🔹 Define se a atualização é necessária comparando os valores existentes com os novos
  const precisaAtualizar =
    !imovelExistente || 
    imovelExistente.idStays !== imovel.id || 
    imovelExistente.sku !== imovel.internalName || 
    imovelExistente.status !== imovel.status || 
    imovelExistente.idCondominioStays !== imovel._idproperty || // ✅ Atualizado para o novo nome
    imovelExistente.proprietarioId !== proprietarioId;

  // 🔹 Realiza o upsert do imóvel no banco de dados
  const imovelSalvo = await prisma.imovel.upsert({
    where: { idExterno: imovel._id },
    update: {
      idStays: imovel.id,
      sku: imovel.internalName,
      status: imovel.status,
      idCondominioStays: imovel._idproperty || null, // ✅ Atualizado para refletir a nova propriedade
      proprietarioId,
      sincronizadoNoJestor: precisaAtualizar ? false : imovelExistente?.sincronizadoNoJestor,
    },
    create: {
      idExterno: imovel._id,
      idStays: imovel.id,
      sku: imovel.internalName,
      status: imovel.status,
      idCondominioStays: imovel._idproperty || null, // ✅ Atualizado para refletir a nova propriedade
      proprietarioId,
      sincronizadoNoJestor: false,
    },
  });

  try {
    // 🚀 Tenta sincronizar o imóvel com o Jestor imediatamente após salvar no banco
    await sincronizarImovel(imovelSalvo);

    // ✅ Atualiza o campo `sincronizadoNoJestor` caso a sincronização seja bem-sucedida
    await prisma.imovel.update({
      where: { id: imovelSalvo.id },
      data: { sincronizadoNoJestor: true },
    });

  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';

    logDebug('Erro', `❌ Erro ao sincronizar imóvel ${imovelSalvo.idExterno} com Jestor: ${errorMessage}`);
    
    // 🔥 Salva o erro na tabela ErroSincronizacao
    await registrarErroJestor('imovel', imovelSalvo.id.toString(), errorMessage);
  }

  return imovelSalvo;
}


/**
 * Salva ou atualiza um condomínio no banco de dados e tenta sincronizá-lo com o Jestor.
 * 
 * @param condominio - Dados detalhados do condomínio a serem salvos ou atualizados.
 * @returns O condomínio salvo no banco de dados.
 */
export async function salvarCondominio(condominio: CondominioDetalhado) {
  // 🔍 Verifica se o condomínio já existe no banco pelo ID externo
  const condominioExistente = await prisma.condominio.findUnique({
    where: { idExterno: condominio._id },
  });

  // 🔍 Define se a atualização é necessária comparando os dados existentes com os novos
  const precisaAtualizar =
    !condominioExistente ||
    condominioExistente.idStays !== condominio.id ||
    condominioExistente.sku !== condominio.internalName ||
    condominioExistente.regiao !== condominio.regiao ||
    condominioExistente.status !== condominio.status; // ✅ Incluímos o status no controle de atualização

  // 🚀 Realiza o upsert do condomínio no banco de dados
  const condominioSalvo = await prisma.condominio.upsert({
    where: { idExterno: condominio._id },
    update: {
      idStays: condominio.id,
      sku: condominio.internalName,
      regiao: condominio.regiao,
      status: condominio.status, // ✅ Atualiza o status
      sincronizadoNoJestor: precisaAtualizar ? false : condominioExistente?.sincronizadoNoJestor,
    },
    create: {
      idExterno: condominio._id,
      idStays: condominio.id,
      sku: condominio.internalName,
      regiao: condominio.regiao,
      status: condominio.status, // ✅ Define o status ao criar um novo registro
      sincronizadoNoJestor: false,
    },
  });

  try {
    // 🚀 Tenta sincronizar o condomínio com o Jestor imediatamente após salvar no banco
    await sincronizarCondominio(condominioSalvo);

    // ✅ Atualiza o campo `sincronizadoNoJestor` caso a sincronização seja bem-sucedida
    await prisma.condominio.update({
      where: { id: condominioSalvo.id },
      data: { sincronizadoNoJestor: true },
    });

  } catch (error: any) {
    const errorMessage = error.message || "Erro desconhecido";

    logDebug("Erro", `❌ Erro ao sincronizar condomínio ${condominioSalvo.idExterno} com Jestor: ${errorMessage}`);
    
    // 🔥 Salva o erro na tabela ErroSincronizacao
    await registrarErroJestor("condominio", condominioSalvo.id.toString(), errorMessage);
  }

  return condominioSalvo;
}



/**
 * Salva ou atualiza as taxas de reserva no banco de dados e tenta sincronizá-las com o Jestor.
 * 
 * @param taxas - Array de taxas detalhadas a serem salvas ou atualizadas.
 */
export async function salvarTaxasReserva(taxas: TaxaReservaDetalhada[]) {
  for (const taxa of taxas) {
    try {
      // 🔍 Valida se a taxa possui um nome válido
      if (!taxa.name || typeof taxa.name !== 'string') {
        logDebug('Aviso', `⚠️ Taxa inválida encontrada: ${JSON.stringify(taxa)}`);
        continue;
      }

      // 🔍 Verifica se a taxa já existe no banco de dados pelo par (reservaId, name)
      const taxaExistente = await prisma.taxaReserva.findUnique({
        where: { reservaId_name: { reservaId: taxa.reservaId, name: taxa.name } },
      });

      // 🔍 Define se a atualização é necessária comparando os valores existentes com os novos
      const precisaAtualizar = !taxaExistente || taxaExistente.valor !== taxa.valor;

      // 🚀 Realiza o upsert da taxa no banco de dados
      const taxaSalva = await prisma.taxaReserva.upsert({
        where: { reservaId_name: { reservaId: taxa.reservaId, name: taxa.name } },
        update: {
          valor: taxa.valor,
          sincronizadoNoJestor: precisaAtualizar ? false : taxaExistente?.sincronizadoNoJestor,
        },
        create: {
          reservaId: taxa.reservaId,
          name: taxa.name,
          valor: taxa.valor,
          sincronizadoNoJestor: false,
        },
      });

      // 🚀 Tenta sincronizar a taxa com o Jestor
      await sincronizarTaxaReserva(taxaSalva);

      // ✅ Atualiza o campo `sincronizadoNoJestor` caso a sincronização seja bem-sucedida
      await prisma.taxaReserva.update({
        where: { id: taxaSalva.id },
        data: { sincronizadoNoJestor: true },
      });

    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';

      logDebug('Erro', `❌ Erro ao sincronizar taxa ${taxa.name} da reserva ${taxa.reservaId} com o Jestor: ${errorMessage}`);
      
      // 🔥 Salva o erro na tabela ErroSincronizacao
      await registrarErroJestor('taxaReserva', taxa.reservaId.toString(), errorMessage);
      
      // ⚠️ Define o campo `sincronizadoNoJestor` como `false` para futuras tentativas
      await prisma.taxaReserva.update({
        where: { reservaId_name: { reservaId: taxa.reservaId, name: taxa.name } },
        data: { sincronizadoNoJestor: false },
      });
    }
  }
}

/**
 * Salva ou atualiza um proprietário no banco de dados e tenta sincronizá-lo com o Jestor.
 * 
 * @param nome - Nome do proprietário a ser salvo ou atualizado.
 * @param telefone - Telefone do proprietário (opcional).
 * @returns O ID do proprietário salvo no banco de dados.
 */
export async function salvarProprietario(nome: string, telefone?: string): Promise<number> {
  // 🔍 Verifica se o proprietário já existe no banco pelo nome e telefone
  const proprietarioExistente = await prisma.proprietario.findFirst({
    where: { nome, telefone },
  });

  // 🔍 Define se a atualização é necessária comparando os dados existentes com os novos
  const precisaAtualizar =
    !proprietarioExistente ||
    proprietarioExistente.nome !== nome ||
    proprietarioExistente.telefone !== telefone;

  // 🚀 Realiza o upsert do proprietário no banco de dados
  const proprietarioSalvo = await prisma.proprietario.upsert({
    where: { id: proprietarioExistente?.id || 0 },
    update: {
      nome,
      telefone: telefone || null,
      sincronizadoNoJestor: precisaAtualizar ? false : proprietarioExistente?.sincronizadoNoJestor,
    },
    create: {
      nome,
      telefone: telefone || null,
      sincronizadoNoJestor: false,
    },
  });

  try {
    // 🚀 Tenta sincronizar o proprietário com o Jestor imediatamente após salvar no banco
    await sincronizarProprietario(proprietarioSalvo);

    // ✅ Atualiza o campo `sincronizadoNoJestor` caso a sincronização seja bem-sucedida
    await prisma.proprietario.update({
      where: { id: proprietarioSalvo.id },
      data: { sincronizadoNoJestor: true },
    });

  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';

    logDebug('Erro', `❌ Erro ao sincronizar proprietário ${proprietarioSalvo.nome} com Jestor: ${errorMessage}`);
    
    // 🔥 Salva o erro na tabela ErroSincronizacao
    await registrarErroJestor('proprietario', proprietarioSalvo.id.toString(), errorMessage);
  }

  return proprietarioSalvo.id;
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

    // 🔹 Verifica se o bloqueio já existe no banco de dados pelo ID externo (_id)
    const bloqueioExistente = await prisma.bloqueio.findUnique({
      where: { idExterno: bloqueio._id },
    });

    // 🔹 Define se a atualização é necessária comparando os valores existentes com os novos
    const precisaAtualizar =
      !bloqueioExistente ||
      bloqueioExistente.localizador !== bloqueio.name ||
      bloqueioExistente.checkIn !== bloqueio.checkIn ||
      bloqueioExistente.checkOut !== bloqueio.checkOut ||
      bloqueioExistente.horaCheckIn !== (bloqueio.horaCheckIn ?? null) ||
      bloqueioExistente.horaCheckOut !== (bloqueio.horaCheckOut ?? null) ||
      bloqueioExistente.notaInterna !== (bloqueio.notaInterna || 'Sem nota interna') ||
      bloqueioExistente.imovelId !== (bloqueio.imovelId ?? null);

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
        sincronizadoNoJestor: precisaAtualizar ? false : bloqueioExistente?.sincronizadoNoJestor,
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
        sincronizadoNoJestor: false,
      },
    });

    try {
      // 🚀 Tenta sincronizar o bloqueio com o Jestor
      await sincronizarBloqueio(bloqueioSalvo);

      // ✅ Atualiza o campo `sincronizadoNoJestor` se a sincronização for bem-sucedida
      await prisma.bloqueio.update({
        where: { id: bloqueioSalvo.id },
        data: { sincronizadoNoJestor: true },
      });
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
export async function salvarCanal(canal: CanalDetalhado): Promise<number> {
  try {
      // 🔍 Verifica se o canal já existe no banco pelo ID externo (_id)
      const canalExistente = await prisma.canal.findUnique({
          where: { idExterno: canal._id },
      });

      // 🔍 Define se a atualização é necessária comparando os dados existentes com os novos
      const precisaAtualizar = 
          !canalExistente || 
          canalExistente.titulo !== canal.titulo;

      // 🚀 Realiza o upsert do canal no banco de dados
      const canalSalvo = await prisma.canal.upsert({
          where: { idExterno: canal._id },
          update: {
              titulo: canal.titulo,
              sincronizadoNoJestor: precisaAtualizar ? false : canalExistente?.sincronizadoNoJestor,
          },
          create: {
              idExterno: canal._id,
              titulo: canal.titulo,
              sincronizadoNoJestor: false,
          },
      });

      try {
          // 🚀 Tenta sincronizar o canal com o Jestor imediatamente após salvar no banco
          await sincronizarCanal({
              id: canalSalvo.id,
              idExterno: canalSalvo.idExterno,
              titulo: canalSalvo.titulo,
          });

          // ✅ Atualiza o campo `sincronizadoNoJestor` caso a sincronização seja bem-sucedida
          await prisma.canal.update({
              where: { id: canalSalvo.id },
              data: { sincronizadoNoJestor: true },
          });

      } catch (error: any) {
          const errorMessage = error.message || 'Erro desconhecido';
          logDebug('Erro', `❌ Erro ao sincronizar canal ${canalSalvo.titulo} com Jestor: ${errorMessage}`);
          await registrarErroJestor('canal', canalSalvo.id.toString(), errorMessage);
      }

      return canalSalvo.id;

  } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      logDebug('Erro', `❌ Erro ao salvar canal ${canal._id}: ${errorMessage}`);
      throw new Error('Erro ao salvar canal');
  }
}

/**
 * Salva ou atualiza um agente no banco de dados e tenta sincronizá-lo com o Jestor.
 * 
 * @param agente - Dados detalhados do agente a serem salvos ou atualizados.
 * @returns O ID do agente salvo no banco de dados.
 */
export async function salvarAgente(agente: AgenteDetalhado): Promise<number> {
  try {
      // 🔍 Verifica se o agente já existe no banco pelo ID externo (_id)
      const agenteExistente = await prisma.agente.findUnique({
          where: { idExterno: agente._id },
      });

      // 🔍 Define se a atualização é necessária comparando os dados existentes com os novos
      const precisaAtualizar = 
          !agenteExistente || 
          agenteExistente.nome !== agente.name;

      // 🚀 Realiza o upsert do agente no banco de dados
      const agenteSalvo = await prisma.agente.upsert({
          where: { idExterno: agente._id },
          update: {
              nome: agente.name,
              sincronizadoNoJestor: precisaAtualizar ? false : agenteExistente?.sincronizadoNoJestor,
          },
          create: {
              idExterno: agente._id,
              nome: agente.name,
              sincronizadoNoJestor: false,
          },
      });

      try {
          // 🚀 Tenta sincronizar o agente com o Jestor imediatamente após salvar no banco
          await sincronizarAgente({
              id: agenteSalvo.id,
              idExterno: agenteSalvo.idExterno,
              nome: agenteSalvo.nome,
          });

          // ✅ Atualiza o campo `sincronizadoNoJestor` caso a sincronização seja bem-sucedida
          await prisma.agente.update({
              where: { id: agenteSalvo.id },
              data: { sincronizadoNoJestor: true },
          });

      } catch (error: any) {
          const errorMessage = error.message || 'Erro desconhecido';
          logDebug('Erro', `❌ Erro ao sincronizar agente ${agenteSalvo.nome} com Jestor: ${errorMessage}`);
          await registrarErroJestor('agente', agenteSalvo.id.toString(), errorMessage);
      }

      return agenteSalvo.id;

  } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      logDebug('Erro', `❌ Erro ao salvar agente ${agente._id}: ${errorMessage}`);
      throw new Error('Erro ao salvar agente');
  }
}