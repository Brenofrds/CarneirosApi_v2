import staysClient from '../../../config/staysClient';
import { HospedeDetalhado, ReservaData, AgenteDetalhado, ImovelDetalhado, CondominioDetalhado, CanalDetalhado, ProprietarioDetalhado, BloqueioDetalhado } from '../stays.types';

export async function fetchHospedeDetalhado(clientId: string): Promise<HospedeDetalhado | null> {
  try {
    const endpoint = `/booking/clients/${clientId}`;
    const response = await staysClient.get(endpoint);
    const data = response.data;

    // Verifica se os dados essenciais existem antes de processar
    if (!data || !data._id || !data.name ) {
      console.warn(`⚠️ Dados insuficientes para o hóspede ${clientId}`);
      return null;
    }

    // 📅 Calcula a idade com base na data de nascimento
    let idadeCalculada: number | undefined = undefined;
    if (data.birthDate) {
      try {
        const birthDate = new Date(data.birthDate);
        const today = new Date();
        idadeCalculada = today.getFullYear() - birthDate.getFullYear();

        // Ajusta caso ainda não tenha feito aniversário este ano
        if (
          today.getMonth() < birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
        ) {
          idadeCalculada--;
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao calcular idade para hóspede ${data.name}: Data inválida (${data.birthDate})`);
      }
    }

    // Retorna os dados do hóspede incluindo a idade já calculada
    return {
      _id: data._id,
      name: data.name,
      email: data.email,
      isUser: data.isUser,
      birthDate: data.birthDate || null,
      idade: idadeCalculada, // ✅ Agora a idade já está calculada aqui!
      phones: data.phones?.map((phone: { iso: string; hint?: string }) => ({
        iso: phone.iso,
        hint: phone.hint || null,
      })),
      documents: data.documents?.map((doc: { type: string; numb: string; issued?: string }) => ({
        type: doc.type,
        numb: doc.numb,
        issued: doc.issued || null,
      })),
    };
  } catch (error: any) {
    if (error.response?.data?.message?.includes('contactEmails/0/adr must match pattern')) {
      console.warn(`⚠️ Hóspede ignorado devido a dados corrompidos: ${clientId}`);
      return null; // Ignorar o hóspede com dados inválidos
    }
    console.error(`❌ Erro ao buscar detalhes do hóspede ${clientId}:`, error.response?.data || error.message);
    return null;
  }
}



/**
 * Busca reservas na API Stays com filtros específicos (from, to, dateType, listingId).
 *
 * @param fromDate - Data de início (YYYY-MM-DD).
 * @param toDate - Data de fim (YYYY-MM-DD).
 * @param listingId - ID do imóvel (listingId).
 * @returns Lista de IDs das reservas encontradas.
 */
export async function fetchReservas(fromDate: string, toDate: string, listingId: string): Promise<string[]> {
  try {
    // 🔹 Construindo a URL apenas com os parâmetros necessários
    const endpoint = `/booking/reservations?from=${fromDate}&to=${toDate}&dateType=arrival&listingId=${listingId}`;

    // 🔹 Fazendo a requisição na API
    const response = await staysClient.get(endpoint);

    // 🔹 Retornar apenas os IDs das reservas
    return response.data.map((reserva: { _id: string }) => reserva._id);
  } catch (error: any) {
    console.error('❌ Erro ao buscar reservas:', error.response?.data || error.message);
    return [];
  }
}

export async function fetchReservaDetalhada(reservationId: string): Promise<any> {
  try {
    const endpoint = `/booking/reservations/${reservationId}`;
    const response = await staysClient.get(endpoint);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar detalhes da reserva ${reservationId}:`, error.response?.data || error.message);
    return null;
  }
}

// Função para buscar os detalhes do imóvel e do proprietário usando o listingId
export async function fetchImovelDetalhado(listingId: string): Promise<{ imovel: ImovelDetalhado | null; proprietario: ProprietarioDetalhado | null }> {
  try {
    const endpoint = `/content/listings/${listingId}`;
    
    const response = await staysClient.get(endpoint);
    const data = response.data;

    // 🔹 Mapeia os status para os valores corretos
    const STATUS_MAP: Record<string, string> = {
      "active": "Ativo",
      "inactive": "Inativo",
      "hidden": "Oculto",
      "draft": "Rascunho"
    };

    // 🔹 Extrair apenas os campos necessários do imóvel
    const imovelDetalhado: ImovelDetalhado = {
      _id: data._id, // ID externo do imóvel na Stays
      id: data.id, // ID interno do imóvel na Stays
      internalName: data.internalName, // Nome interno ou SKU do imóvel
      status: STATUS_MAP[data.status] || "Oculto", // Traduz o status ou usa "Oculto" por padrão
      _idproperty: data._idproperty, // ID externo do condomínio relacionado
      regiao: data.address?.region || "Região não especificada",
    };

    // 🔹 Extrair dados do proprietário (se existirem na resposta)
    const proprietarioDetalhado: ProprietarioDetalhado | null = data.owner
      ? {
          nome: data.owner.name,
          telefone: data.owner.phones?.[0]?.iso || null, // Pega o primeiro telefone se existir
        }
      : null;

    return { imovel: imovelDetalhado, proprietario: proprietarioDetalhado };
  } catch (error: any) {
    console.error(`Erro ao buscar detalhes do imóvel ${listingId}: ${error.message || 'Erro desconhecido'}`);
    return { imovel: null, proprietario: null };
  }
}



/**
 * Função para buscar os detalhes do condomínio usando o ID externo.
 * @param condominioId - ID externo do condomínio na API Stays.
 * @returns Os detalhes do condomínio no formato CondominioDetalhado.
 */
export async function fetchCondominioDetalhado(condominioId: string): Promise<CondominioDetalhado | null> {
  try {
    const endpoint = `/content/properties/${condominioId}`;
    const response = await staysClient.get(endpoint);

    // Extrair apenas os campos necessários
    const data = response.data;

    // Mapeia os status para os valores corretos
    const statusMap: Record<string, string> = {
      "active": "Ativo",
      "inactive": "Inativo",
      "hidden": "Oculto"
    };

    const condominioDetalhado: CondominioDetalhado = {
      _id: data._id, // ID externo do condomínio
      id: data.id, // ID interno na Stays
      internalName: data.internalName, // Nome interno ou SKU do condomínio
      regiao: data.address?.region || "Região não especificada", // Região do condomínio
      status: statusMap[data.status] || "Oculto", // Traduz o status ou usa "Oculto" por padrão
      titulo: data._mstitle?.pt_BR || "Título não especificado"
    };

    return condominioDetalhado;
  } catch (error: any) {
    console.error(`Erro ao buscar detalhes do condomínio ${condominioId}:`, error.response?.data || error.message);
    return null;
  }
}

