import staysClient from '../../config/staysClient';
import {
  ReservaData,
  HospedeDetalhado,
  AgenteDetalhado,
  FetchDataReservasParams
} from './stays.types';
import { correspReserva } from './stays.corresp';
import { mapToTable } from '../../utils/dataTransform';


const STAYS_RESERVATIONS = 'https://cta.stays.com.br/external/v1/booking/reservations'
const STAYS_HOSPEDES = 'https://cta.stays.com.br/external/v1/booking/clients';

//Busca os dados das reservas
export async function fetchDataReserva({fromDate, toDate, skip, limit}: FetchDataReservasParams){
  try{
    const endpoint = `${STAYS_RESERVATIONS}?from=${fromDate}&to=${toDate}&dateType=arrival&skip=${skip}&limit=${limit}`;
    const response = await staysClient.get(endpoint);
    //os dados estao em response.data)
    console.log(response.data);

    /*--------------------------------------------------
    response.data.map(...): Estamos usando o método map
    para iterar sobre todos os objetos no array 
    response.data. A função map cria um novo array, 
    aplicando a função mapToTable a cada item do array.
    */
    const dadosMapeados = response.data.map((item: any)=> mapToTable(correspReserva, item));
    return dadosMapeados;
  } catch (error: any) {
    console.error('Erro ao buscar reservas:', error.response?.data || error.message);
    return null;
  }
}

//Busca os dados dos hospedes
export async function fetchDataHospedeId(clientId: string){
  try{
    const endpoint = `${STAYS_HOSPEDES}/${clientId}`;
    const response = await staysClient.get(endpoint);

    console.log('Response do CLIENT:\n', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar detalhes do hospede ${clientId}:`, error.response?.data || error.message);
    return null;
  }
}

//test
(async()=>{
  const reservas = await fetchDataReserva({
    fromDate:'2024-02-01',
    toDate:'2024-02-02',
    skip:0,
    limit:1
  });
  console.log(reservas.idHospede);
  const hospedes = await fetchDataHospedeId(reservas.idHospede);
  //const hospedes = await fetchDataHospedeId('65bc3e403a9baa2ae442d3b8');
  console.log('Dados da reserva:.........\n ',reservas);
  console.log('Hospedes:.........\n',hospedes);
})();





/*
//Salva os dados no banco de dados
export async function saveDataBD(tabela: string, response: any){
}
*/