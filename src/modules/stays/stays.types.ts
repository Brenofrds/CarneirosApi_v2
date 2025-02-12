// Tipo para os detalhes do hóspede obtidos na API Stays
export interface HospedeDetalhado {
  _id: string;
  name: string;
  email: string;
  isUser: boolean;
  birthDate?: string;
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
  idImovelStays: string; // ID do imóvel na Stays
  imovelId: number | null; // ID do imóvel relacionado no banco de dados
  canalId: number | null; // ID do canal relacionado no banco de dados
  agenteId: string | null;
  origem: string; // Mantendo origem da reserva
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

// Tipo para os detalhes do imóvel obtidos na API Stays
export interface ImovelDetalhado {
  _id: string;         // ID externo do imóvel na Stays
  id: string;          // ID interno na Stays
  internalName: string; // Nome interno ou SKU do imóvel
  status: string;       // Status do imóvel (ex.: hidden, active)
  _idproperty?: string; // ID externo do condomínio relacionado
}

// Tipo para os detalhes do condomínio obtidos na API Stays
export interface CondominioDetalhado {
  _id: string;         // ID externo do condomínio na Stays
  id: string;          // ID interno na Stays
  internalName: string; // Nome interno ou SKU do condomínio
  regiao: string;       // Região do condomínio
}

// Tipo para os detalhes da taxa de reserva
export interface TaxaReservaDetalhada {
  reservaId: number;     // ID da reserva relacionada no banco de dados
  name: string;          // Nome da taxa (ex.: Taxa de Limpeza, ISS)
  valor: number;         // Valor da taxa
}

// Tipo para os detalhes do canal obtidos na API Stays
export interface CanalDetalhado {
  _id: string;   // ID externo do canal (partner._id)
  titulo: string; // Nome do canal (partner.name)
}