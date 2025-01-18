/*--------------------------------------------------
INTERFACE

1.Parametros de funcoes
2.Tabelas: campos
*/

// Interface para os parametros de busca de reservas
export interface FetchDataReservasParams {
    fromDate: string;
    toDate: string;
    skip: number;
    limit: number;
}

// Tipo para os detalhes do hóspede obtidos na API Stays
export interface HospedeDetalhado {
    _id: string;
    kind: string;
    fName: string;
    lName: string;
    name: string;
    email: string;
    isUser: boolean;
    creationDate: string;
    birthDate?: string;
    nationality?: string;
    clientSource: string;
    contactEmails: { adr: string }[];
    phones?: { iso: string; hint?: string }[];
    documents?: { type: string; numb: string; issued?: string }[];
}
  
// Tabela: Reserva. Tipo para os dados transformados de reserva
export interface ReservaData {
    //--------------------------------------------------
    idReserva: string;
    localizador: string;
    dataDaCriacao: string; // Somente data no formato YYYY-MM-DD
    checkInData: string;   // Somente data no formato YYYY-MM-DD
    CheckInHora: string;   // Somente hora no formato HH:mm
    checkOutData: string;  // Somente data no formato YYYY-MM-DD
    CheckOutHora: string;  // Somente hora no formato HH:mm
    //--------------------------------------------------
    idImovelStays: string;
    //--------------------------------------------------
    idHospede: string;
    //--------------------------------------------------
    status: string;
    //--------------------------------------------------
    agenteId: string | null;
    agenteNome: string | null;
    //--------------------------------------------------
    moeda: string;
    valorTotal: number;
    totalPago: number;
    //--------------------------------------------------
    quantidadeHospedes: number;
    quantidadeAdultos: number;
    quantidadeCriancas: number;
    quantidadeInfantil: number;
    //--------------------------------------------------
    partnerCode: string;
    linkStays: string;
    canaisTitulo: string;
    origem: string;

    //calculados----------------------------------------
    pendenteQuitacao: number;
    totalTaxasExtras: number;
    quantidadeDiarias: number;

    //deOutraTabela-------------------------------------
    condominio: string;
    regiao: string;
    imovelOficialSku: string;
}

// Tipo para os detalhes do agente obtidos na API Stays
export interface AgenteDetalhado {
  _id: string;  // ID do agente na Stays
  name: string; // Nome do agente
}