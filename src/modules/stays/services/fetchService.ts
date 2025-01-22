import staysClient from '../../../config/staysClient';
import { HospedeDetalhado, ReservaData, AgenteDetalhado } from '../stays.types';

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