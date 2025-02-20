import staysClient from '../../../config/staysClient';
import { HospedeDetalhado, ReservaData, AgenteDetalhado, ImovelDetalhado, CondominioDetalhado, CanalDetalhado, ProprietarioDetalhado, BloqueioDetalhado } from '../stays.types';

export async function fetchHospedeDetalhado(clientId: string): Promise<HospedeDetalhado | null> {
  try {
    const endpoint = `/booking/clients/${clientId}`;
    const response = await staysClient.get(endpoint);

    const data = response.data;

    // Verifica se os dados essenciais existem antes de processar
    if (!data || !data._id || !data.name || !data.email) {
      console.warn(`Dados insuficientes para o hóspede ${clientId}`);
      return null;
    }

    // Mapeia os dados necessários
    const hospedeDetalhado: HospedeDetalhado = {
      _id: data._id,
      name: data.name,
      email: data.email,
      isUser: data.isUser,
      birthDate: data.birthDate || null,
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

    return hospedeDetalhado;
  } catch (error: any) {
    if (error.response?.data?.message?.includes('contactEmails/0/adr must match pattern')) {
      console.warn(`Hóspede ignorado devido a dados corrompidos: ${clientId}`);
      return null; // Ignorar o hóspede com dados inválidos
    }
    console.error(`Erro ao buscar detalhes do hóspede ${clientId}:`, error.response?.data || error.message);
    return null;
  }
}


export async function fetchReservas(fromDate: string, toDate: string, skip: number, limit: number): Promise<string[]> {
  try {
    const endpoint = `/booking/reservations?from=${fromDate}&to=${toDate}&dateType=arrival&skip=${skip}&limit=${limit}`;
    const response = await staysClient.get(endpoint);

    // Retornar apenas os IDs das reservas
    return response.data.map((reserva: { _id: string }) => reserva._id);
  } catch (error: any) {
    console.error('Erro ao buscar reservas:', error.response?.data || error.message);
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

    // Extrair apenas os campos necessários do imóvel
    const imovelDetalhado: ImovelDetalhado = {
      _id: data._id, // ID externo do imóvel na Stays
      id: data.id, // ID interno do imóvel na Stays
      internalName: data.internalName, // Nome interno ou SKU do imóvel
      status: data.status, // Status do imóvel
      _idproperty: data._idproperty, // ID externo do condomínio relacionado
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
    console.error(`Erro ao buscar detalhes do imóvel ${listingId}:`, error.response?.data || error.message);
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
    const condominioDetalhado: CondominioDetalhado = {
      _id: data._id, // ID externo do condomínio
      id: data.id, // ID interno na Stays
      internalName: data.internalName, // Nome interno ou SKU do condomínio
      regiao: data.address?.region || 'Região não especificada', // Região do condomínio
    };

    return condominioDetalhado;
  } catch (error: any) {
    console.error(`Erro ao buscar detalhes do condomínio ${condominioId}:`, error.response?.data || error.message);
    return null;
  }
}

