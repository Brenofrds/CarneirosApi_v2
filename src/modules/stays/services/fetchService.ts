import staysClient from '../../../config/staysClient';
import { HospedeDetalhado, ReservaData, AgenteDetalhado, ImovelDetalhado } from '../stays.types';

// Função para buscar os detalhes do hóspede usando o clientId
export async function fetchHospedeDetalhado(clientId: string): Promise<HospedeDetalhado | null> {
  try {
    const endpoint = `/booking/clients/${clientId}`;
    const response = await staysClient.get(endpoint);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar detalhes do hóspede ${clientId}:`, error.response?.data || error.message);
    return null;
  }
}

// Função para buscar reservas com filtros de data e paginação
export async function fetchReservas(fromDate: string, toDate: string, skip: number, limit: number) {
  try {
    const endpoint = `/booking/reservations?from=${fromDate}&to=${toDate}&dateType=arrival&skip=${skip}&limit=${limit}`;
    const response = await staysClient.get(endpoint);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar reservas:', error.response?.data || error.message);
    return [];
  }
}

// Função para buscar os detalhes do imóvel usando o listingId
export async function fetchImovelDetalhado(listingId: string): Promise<ImovelDetalhado | null> {
  try {
    const endpoint = `/content/listings/${listingId}`;
    const response = await staysClient.get(endpoint);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar detalhes do imóvel ${listingId}:`, error.response?.data || error.message);
    return null;
  }
}
