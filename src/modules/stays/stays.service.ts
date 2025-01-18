import staysClient from '../../config/staysClient';
import {
  ReservaData,
  HospedeDetalhado,
  AgenteDetalhado,
  Canal,
  FetchDataReservasParams
} from './stays.types';

const STAYS_RESERVATIONS = 'https://cta.stays.com.br/external/v1/booking/reservations'

//Busca os dados das reservas
export async function fetchDataReserva({fromDate, toDate, skip, limit}: FetchDataReservasParams){
  try{
    const endpoint = `${STAYS_RESERVATIONS}?from=${fromDate}&to=${toDate}&dateType=arrival&skip=${skip}&limit=${limit}`;
    const response = await staysClient.get(endpoint);
    //const reservas = response.data; //(ou seja, os dados estao em response.data)
  }
}

//Salva os dados no banco de dados
export async function saveDataBD(tabela: string, response: any){


}

const tableCorresp = {

  
}

export async function fetchDataHospede(){

}

export async function fetchDataHospedeId(){

}