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
  
// Tipo para os dados transformados de reserva
export interface ReservaData {
  localizador: string;
  idExterno: string;
  dataDaCriacao: string; // Somente data no formato YYYY-MM-DD
  checkIn: string;       // Somente data no formato YYYY-MM-DD
  horaCheckIn: string;   // Somente hora no formato HH:mm
  checkOut: string;      // Somente data no formato YYYY-MM-DD
  horaCheckOut: string;  // Somente hora no formato HH:mm
  quantidadeHospedes: number;
  quantidadeAdultos: number;
  quantidadeCriancas: number;
  quantidadeInfantil: number;
  moeda: string;
  valorTotal: number;
  totalPago: number;
  pendenteQuitacao: number;
  totalTaxasExtras: number;
  quantidadeDiarias: number;
  partnerCode: string;
  linkStays: string;
  idImovelStays: string;
  canaisTitulo: string;
  agenteId: string | null;
  origem: string;
  status: string;
  condominio: string;
  regiao: string;
  imovelOficialSku: string;
}

// Tipo para os detalhes do agente obtidos na API Stays
export interface AgenteDetalhado {
  _id: string;  // ID do agente na Stays
  name: string; // Nome do agente
}