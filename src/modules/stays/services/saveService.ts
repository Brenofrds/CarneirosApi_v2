import prisma from '../../../config/database';
import { ReservaData, HospedeDetalhado, AgenteDetalhado, ImovelDetalhado, CondominioDetalhado, TaxaReservaDetalhada, CanalDetalhado, BloqueioDetalhado } from '../stays.types';


export async function salvarReserva(reserva: ReservaData) {
  // 🔹 Verifica se a reserva já existe no banco de dados pelo localizador (campo único)
  const reservaExistente = await prisma.reserva.findUnique({
    where: { localizador: reserva.localizador },
  });

  /**
   * 🔹 Determina se a reserva precisa ser atualizada
   * 
   * O critério para atualizar é:
   * 1️⃣ Se `reservaExistente` for `null`, significa que a reserva não existe → Precisa ser criada.
   * 2️⃣ Se `reservaExistente` existir, compararmos o objeto salvo com o novo objeto `reserva`:
   *     - Se forem diferentes (`JSON.stringify(reservaExistente) !== JSON.stringify(reserva)`), então houve uma mudança → Precisa ser atualizada.
   *     - Se forem iguais, significa que os dados já estão corretos → Não precisa atualizar.
   */
  const precisaAtualizar =
    !reservaExistente || // Reserva não existe? Então precisa ser salva.
    JSON.stringify(reservaExistente) !== JSON.stringify(reserva); // Compara se os dados mudaram.

  /**
   * 🔹 Realiza um `upsert` para criar ou atualizar a reserva.
   * 
   * `upsert`: Se a reserva já existir, atualiza; se não existir, cria.
   */
  return await prisma.reserva.upsert({
    where: { localizador: reserva.localizador }, // 🔍 Usa o localizador como identificador único.

    // 🔄 Atualiza a reserva se ela já existir
    update: {
      ...reserva, // ✅ Copia todos os dados da reserva
      imovelId: reserva.imovelId ?? null, // 🏠 Atualiza o ID do imóvel (ou `null` se não existir)
      agenteId: reserva.agenteId,  // 🔗 Atualiza o ID do agente no banco
      canalId: reserva.canalId,    // 🔗 Atualiza o ID do canal no banco

      /**
       * 🔹 Atualiza o campo `sincronizadoNoJestor`
       * 
       * - Se a reserva precisa ser atualizada (`precisaAtualizar === true`), então define como `false` (ainda não sincronizada).
       * - Se a reserva não mudou (`precisaAtualizar === false`), mantém o valor original do banco (`reservaExistente?.sincronizadoNoJestor`).
       */
      sincronizadoNoJestor: precisaAtualizar ? false : reservaExistente?.sincronizadoNoJestor,
    },

    // 🆕 Se a reserva ainda não existir, cria um novo registro
    create: {
      ...reserva, // ✅ Copia todos os dados da reserva
      imovelId: reserva.imovelId ?? null, // 🏠 Associa a um imóvel (ou `null` se não existir)
      agenteId: reserva.agenteId,  // 🔗 Associa a um agente
      canalId: reserva.canalId,    // 🔗 Associa a um canal

      /**
       * 🔹 Sempre define `sincronizadoNoJestor = false` ao criar uma nova reserva
       * Isso garante que novas reservas serão sincronizadas posteriormente.
       */
      sincronizadoNoJestor: false,
    },
  });
}


export async function salvarHospede(hospede: HospedeDetalhado | null, reservaId: number) {
  // 🔹 Se não houver hóspede, não faz nada e retorna imediatamente
  if (!hospede) return;

  // 🔹 Verifica se o hóspede já existe no banco de dados pelo ID externo (_id)
  const hospedeExistente = await prisma.hospede.findUnique({
    where: { idExterno: hospede._id },
  });

  // 🔹 Define se a atualização é necessária comparando os valores existentes com os novos
  const precisaAtualizar =
    !hospedeExistente || // Se o hóspede não existir, precisa ser criado
    hospedeExistente.nomeCompleto !== hospede.name || // Se o nome mudou
    hospedeExistente.email !== hospede.email || // Se o e-mail mudou
    hospedeExistente.dataDeNascimento !== hospede.birthDate || // Se a data de nascimento mudou
    hospedeExistente.telefone !== hospede.phones?.[0]?.iso || // Se o telefone principal mudou
    hospedeExistente.cpf !== hospede.documents?.find((doc) => doc.type === 'cpf')?.numb || // Se o CPF mudou
    hospedeExistente.documento !== hospede.documents?.find((doc) => doc.type === 'id')?.numb; // Se o documento de identidade mudou

  // 🔹 Faz um upsert (atualiza ou insere) do hóspede no banco
  await prisma.hospede.upsert({
    where: { idExterno: hospede._id }, // Busca pelo ID externo
    update: {
      nomeCompleto: hospede.name, // Atualiza o nome do hóspede
      email: hospede.email, // Atualiza o e-mail
      dataDeNascimento: hospede.birthDate || null, // Atualiza a data de nascimento
      telefone: hospede.phones?.[0]?.iso || null, // Atualiza o telefone principal
      cpf: hospede.documents?.find((doc) => doc.type === 'cpf')?.numb || null, // Atualiza o CPF se existir
      documento: hospede.documents?.find((doc) => doc.type === 'id')?.numb || null, // Atualiza o documento de identidade se existir
      reservaId, // Associa o hóspede à reserva correta
      sincronizadoNoJestor: precisaAtualizar ? false : hospedeExistente?.sincronizadoNoJestor, // Só marca como "não sincronizado" se os dados mudarem
    },
    create: {
      idExterno: hospede._id, // Cria um novo hóspede com o ID externo da Stays
      nomeCompleto: hospede.name, // Nome completo
      email: hospede.email, // E-mail
      dataDeNascimento: hospede.birthDate || null, // Data de nascimento
      telefone: hospede.phones?.[0]?.iso || null, // Telefone principal
      cpf: hospede.documents?.find((doc) => doc.type === 'cpf')?.numb || null, // CPF se existir
      documento: hospede.documents?.find((doc) => doc.type === 'id')?.numb || null, // Documento de identidade se existir
      reservaId, // Relaciona o hóspede com a reserva correspondente
      sincronizadoNoJestor: false, // Como é um novo hóspede, ele ainda não foi sincronizado com o Jestor
    },
  });
}



export async function salvarImovel(imovel: ImovelDetalhado) {
  // 🔹 Verifica se o imóvel já existe no banco pelo ID externo (_id)
  const imovelExistente = await prisma.imovel.findUnique({
    where: { idExterno: imovel._id },
  });

  // 🔹 Verifica se há um proprietário associado ao imóvel e salva antes de continuar
  let proprietarioId: number | null = null;
  if (imovel.owner) {
    proprietarioId = await salvarProprietario(imovel.owner.nome, imovel.owner.telefone);
  }

  // 🔹 Define se a atualização é necessária comparando os valores existentes com os novos
  const precisaAtualizar =
    !imovelExistente || // Se o imóvel não existir, precisa ser criado
    imovelExistente.idStays !== imovel.id || // Se o ID interno da Stays mudou
    imovelExistente.sku !== imovel.internalName || // Se o SKU (nome interno) mudou
    imovelExistente.status !== imovel.status || // Se o status do imóvel mudou
    imovelExistente.idCondominioStays !== imovel._idproperty || // Se o ID do condomínio mudou
    imovelExistente.proprietarioId !== proprietarioId; // Se o proprietário mudou

  // 🔹 Faz um upsert (atualiza ou insere) do imóvel no banco
  return await prisma.imovel.upsert({
    where: { idExterno: imovel._id }, // Busca pelo ID externo
    update: {
      idStays: imovel.id, // Atualiza o ID interno da Stays
      sku: imovel.internalName, // Atualiza o SKU (nome interno)
      status: imovel.status, // Atualiza o status do imóvel
      idCondominioStays: imovel._idproperty || null, // Atualiza o ID externo do condomínio relacionado
      proprietarioId, // 🔗 Atualiza o relacionamento com o proprietário
      sincronizadoNoJestor: precisaAtualizar ? false : imovelExistente?.sincronizadoNoJestor, // Marca como "não sincronizado" apenas se os dados mudarem
    },
    create: {
      idExterno: imovel._id, // Cria um novo imóvel com o ID externo da Stays
      idStays: imovel.id, // Preenche o ID interno da Stays
      sku: imovel.internalName, // Preenche o SKU (nome interno)
      status: imovel.status, // Preenche o status do imóvel
      idCondominioStays: imovel._idproperty || null, // Preenche o ID externo do condomínio relacionado
      proprietarioId, // 🔗 Relaciona o imóvel com o proprietário salvo
      sincronizadoNoJestor: false, // Como é um novo imóvel, ele ainda não foi sincronizado com o Jestor
    },
  });
}




export async function salvarCondominio(condominio: CondominioDetalhado) {
  // 🔹 Verifica se o condomínio já existe no banco pelo ID externo (_id)
  const condominioExistente = await prisma.condominio.findUnique({
    where: { idExterno: condominio._id },
  });

  // 🔹 Define se a atualização é necessária comparando os valores existentes com os novos
  const precisaAtualizar =
    !condominioExistente || // Se o condomínio não existir, precisa ser criado
    condominioExistente.idStays !== condominio.id || // Se o ID interno da Stays mudou
    condominioExistente.sku !== condominio.internalName || // Se o SKU (nome interno) mudou
    condominioExistente.regiao !== condominio.regiao; // Se a região mudou

  // 🔹 Faz um upsert (atualiza ou insere) do condomínio no banco de dados
  return await prisma.condominio.upsert({
    where: { idExterno: condominio._id }, // Busca pelo ID externo (_id)
    update: {
      idStays: condominio.id, // Atualiza o ID interno da Stays
      sku: condominio.internalName, // Atualiza o SKU (nome interno)
      regiao: condominio.regiao, // Atualiza a região do condomínio
      sincronizadoNoJestor: precisaAtualizar ? false : condominioExistente?.sincronizadoNoJestor, // Marca como "não sincronizado" apenas se houve atualização nos dados
    },
    create: {
      idExterno: condominio._id, // Cria um novo condomínio com o ID externo da Stays
      idStays: condominio.id, // ID interno da Stays
      sku: condominio.internalName, // Nome interno do condomínio
      regiao: condominio.regiao, // Região do condomínio
      sincronizadoNoJestor: false, // Como é um novo registro, ele ainda não foi sincronizado com o Jestor
    },
  });
}


export async function salvarTaxasReserva(taxas: TaxaReservaDetalhada[]) {
  try {
    // 🔹 Percorre todas as taxas recebidas
    for (const taxa of taxas) {
      
      // 🔹 Se a taxa não tiver um nome válido, ela é ignorada para evitar erros no banco de dados
      if (!taxa.name || typeof taxa.name !== 'string') {
        console.warn(`Taxa inválida encontrada: ${JSON.stringify(taxa)}`);
        continue; // Pula para a próxima taxa sem tentar salvar a inválida
      }

      // 🔹 Verifica se a taxa já existe no banco de dados, identificando pela combinação reservaId + name (chave única)
      const taxaExistente = await prisma.taxaReserva.findUnique({
        where: { reservaId_name: { reservaId: taxa.reservaId, name: taxa.name } },
      });

      // 🔹 Define se a atualização é necessária comparando o valor da taxa no banco com o novo valor recebido
      const precisaAtualizar = !taxaExistente || taxaExistente.valor !== taxa.valor;

      // 🔹 Faz um upsert (atualiza se já existir, insere se não existir) da taxa de reserva
      await prisma.taxaReserva.upsert({
        where: { reservaId_name: { reservaId: taxa.reservaId, name: taxa.name } }, // Chave única
        update: {
          valor: taxa.valor, // Atualiza o valor da taxa caso necessário
          sincronizadoNoJestor: precisaAtualizar ? false : taxaExistente?.sincronizadoNoJestor, 
          // 🔹 Se a taxa foi modificada, marca `sincronizadoNoJestor = false` para indicar que precisa ser sincronizada
          // 🔹 Caso contrário, mantém o valor atual de `sincronizadoNoJestor`
        },
        create: {
          reservaId: taxa.reservaId, // Associa a taxa à reserva correta
          name: taxa.name, // Nome da taxa (ex.: "Taxa de Limpeza", "Taxa de Serviço")
          valor: taxa.valor, // Valor da taxa
          sincronizadoNoJestor: false, // Como é uma nova taxa, ainda não foi sincronizada com o Jestor
        },
      });
    }
  } catch (error) {
    // 🔹 Captura qualquer erro que ocorra no processo e exibe no console
    console.error('Erro ao salvar taxas de reserva:', error);
    throw new Error('Não foi possível salvar as taxas de reserva.');
  }
}

export async function salvarProprietario(nome: string, telefone?: string) {
  // 🔹 Verifica se o proprietário já existe no banco pelo nome e telefone
  const proprietarioExistente = await prisma.proprietario.findFirst({
    where: { nome, telefone },
  });

  // 🔹 Define se a atualização é necessária comparando os valores existentes com os novos
  const precisaAtualizar =
    !proprietarioExistente || // Se o proprietário não existir, precisa ser criado
    proprietarioExistente.nome !== nome || // Se o nome mudou
    proprietarioExistente.telefone !== telefone; // Se o telefone mudou

  // 🔹 Faz um upsert (atualiza ou insere) do proprietário no banco
  const proprietario = await prisma.proprietario.upsert({
    where: { id: proprietarioExistente?.id || 0 }, // Usa ID se existir, senão força um ID inválido
    update: {
      nome, // Atualiza o nome do proprietário
      telefone: telefone || null, // Atualiza o telefone ou mantém null
      sincronizadoNoJestor: precisaAtualizar ? false : proprietarioExistente?.sincronizadoNoJestor, // Mantém o sincronizadoNoJestor apenas se não houver mudanças
    },
    create: {
      nome, // Cria um novo proprietário com o nome
      telefone: telefone || null, // Cria com o telefone ou null
      sincronizadoNoJestor: false, // Como é um novo proprietário, ainda não foi sincronizado com o Jestor
    },
  });

  return proprietario.id; // Retorna o ID do proprietário salvo
}

export async function salvarBloqueio(bloqueio: BloqueioDetalhado) {
  try {
    console.log(`📌 Salvando bloqueio: ${bloqueio._id}`);

    // 🔹 Verifica se o bloqueio já existe no banco de dados pelo ID externo (_id)
    const bloqueioExistente = await prisma.bloqueio.findUnique({
      where: { idExterno: bloqueio._id },
    });

    /**
     * 🔹 Determina se o bloqueio precisa ser atualizado.
     *
     * O critério para atualizar é:
     * 1️⃣ Se `bloqueioExistente` for `null`, significa que o bloqueio não existe → Precisa ser criado.
     * 2️⃣ Se `bloqueioExistente` existir, compararmos os campos relevantes:
     *     - Se algum campo importante mudou, então precisa ser atualizado.
     */
    const precisaAtualizar =
      !bloqueioExistente || // Bloqueio não existe? Então precisa ser salvo.
      bloqueioExistente.localizador !== bloqueio.name ||
      bloqueioExistente.checkIn !== bloqueio.checkIn ||
      bloqueioExistente.checkOut !== bloqueio.checkOut ||
      bloqueioExistente.horaCheckIn !== (bloqueio.horaCheckIn ?? null) ||
      bloqueioExistente.horaCheckOut !== (bloqueio.horaCheckOut ?? null) ||
      bloqueioExistente.notaInterna !== (bloqueio.notaInterna || "Sem nota interna") ||
      bloqueioExistente.imovelId !== (bloqueio.imovelId ?? null);

    /**
     * 🔹 Realiza um `upsert` para criar ou atualizar o bloqueio.
     *
     * `upsert`: Se o bloqueio já existir, atualiza; se não existir, cria.
     */
    return await prisma.bloqueio.upsert({
      where: { idExterno: bloqueio._id }, // 🔍 Usa o ID externo como identificador único.

      // 🔄 Atualiza o bloqueio se ele já existir
      update: {
        localizador: bloqueio.name, // Atualiza o nome (identificador do bloqueio)
        checkIn: bloqueio.checkIn, // Atualiza a data de check-in
        checkOut: bloqueio.checkOut, // Atualiza a data de check-out
        horaCheckIn: bloqueio.horaCheckIn ?? null, // Atualiza a hora de check-in (se houver)
        horaCheckOut: bloqueio.horaCheckOut ?? null, // Atualiza a hora de check-out (se houver)
        notaInterna: bloqueio.notaInterna || "Sem nota interna", // Atualiza a nota interna
        imovelId: bloqueio.imovelId ?? null, // Atualiza o ID do imóvel relacionado

        /**
         * 🔹 Atualiza o campo `sincronizadoNoJestor`
         *
         * - Se o bloqueio precisa ser atualizado (`precisaAtualizar === true`), então define como `false` (ainda não sincronizado).
         * - Se o bloqueio não mudou (`precisaAtualizar === false`), mantém o valor original do banco (`bloqueioExistente?.sincronizadoNoJestor`).
         */
        sincronizadoNoJestor: precisaAtualizar ? false : bloqueioExistente?.sincronizadoNoJestor,
      },

      // 🆕 Se o bloqueio ainda não existir, cria um novo registro
      create: {
        idExterno: bloqueio._id, // Cria um novo bloqueio com o ID externo da Stays
        localizador: bloqueio.name, // Define o identificador do bloqueio
        checkIn: bloqueio.checkIn, // Define a data de check-in
        checkOut: bloqueio.checkOut, // Define a data de check-out
        horaCheckIn: bloqueio.horaCheckIn ?? null, // Define a hora de check-in (se houver)
        horaCheckOut: bloqueio.horaCheckOut ?? null, // Define a hora de check-out (se houver)
        notaInterna: bloqueio.notaInterna || "Sem nota interna", // Define a nota interna
        imovelId: bloqueio.imovelId ?? null, // Associa o bloqueio a um imóvel (ou `null` se não existir)

        /**
         * 🔹 Sempre define `sincronizadoNoJestor = false` ao criar um novo bloqueio.
         * Isso garante que novos bloqueios sejam sincronizados posteriormente.
         */
        sincronizadoNoJestor: false,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao salvar bloqueio:", error);
    throw new Error("Erro ao salvar bloqueio."); // Lança um erro para tratamento externo
  }
}

