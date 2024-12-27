import staysClient from '../../config/staysClient';

// Interface para os parâmetros de busca de reservas
interface FetchDataReservasParams {
  fromDate: string;
  toDate: string;
  skip: number;
  limit: number;
}

// Função para buscar reservas e imprimir os dados que já podem ser preenchidos
export async function fetchDataReservas({ fromDate, toDate, skip, limit }: FetchDataReservasParams) {
  const endpoint = `/booking/reservations?from=${fromDate}&to=${toDate}&dateType=arrival&skip=${skip}&limit=${limit}`;
  try {
    const response = await staysClient.get(endpoint);
    const reservations = response.data;

    // Itera sobre as reservas e imprime os dados no terminal
    reservations.forEach((reservation: any) => {
      console.log('===============================');
      console.log(`Agente ID: ${reservation.agent?._id || 'N/A'}`); // Caso o agente não exista, retorna 'N/A'
      console.log(`Nome do Agente: ${reservation.agent?.name || 'N/A'}`); // Caso o nome do agente não exista, retorna 'N/A'
      console.log('===============================');
    });


    return reservations; // Retorna as reservas, caso necessário
  } catch (error) {
    console.error('Erro ao buscar dados da API de reservas:', error);
    throw error;
  }
}

// Chamada para testar a função
fetchDataReservas({
  fromDate: '2024-02-29',
  toDate: '2024-03-29',
  skip: 1,
  limit: 20, // Define o limite de reservas a serem buscadas
})
  .then(() => {
    console.log('Dados das reservas processados com sucesso!');
  })
  .catch((error) => {
    console.error('Erro ao processar reservas:', error);
  });
