/*--------------------------------------------------
INTERFACE

1.Parametros de funcoes
2.Tabelas: campos
*/

//Interface para os parametros de busca de reservas
export interface FetchDataReservasParams {
    fromDate: string;
    toDate: string;
    skip: number;
    limit: number;
}

//Tabela: Reserva
export interface Reserva {
    localizador: string;
    dataCriacao: string;
    checkIn: string;
    checkOut: string;
    quantHospedes: number;
    adultos: number;
    criancas: number;
    infantil: number;
    moeda: string;
    valorTotal: number;
    totalPago: number;
    pendenteQuitacao: number;
    diarias: number;
    codigoParceiro: string;
    linkReserva: string;
    idImovel: string;
    idAgente: string;
    idCanal: string;
}
  
export interface Agente {
    id: string;
    name: string;
}
  
export interface Canal {
    id: string;
    titulo: string;
}