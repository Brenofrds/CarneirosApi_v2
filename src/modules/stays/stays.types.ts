// Tipo para os detalhes do hóspede obtidos na API Stays
export interface HospedeDetalhado {
  _id: string;
  name: string;
  email: string;
  isUser: boolean;
  birthDate?: string;
  idade?: number;
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
  agenteId: number | null;
  origem: string; // Mantendo origem da reserva
  status: string;
  condominio: string;
  regiao: string;
  imovelOficialSku: string;
  observacao: string | null;
}

// Tipo para os detalhes do agente obtidos na API Stays
export interface AgenteDetalhado {
  _id: string;  // ID do agente na Stays
  name: string; // Nome do agente
}

export interface ImovelDetalhado {
  _id: string;         // ID externo do imóvel na Stays
  id: string;          // ID interno na Stays
  internalName: string; // Nome interno ou SKU do imóvel
  status: string;       // Status do imóvel (ex.: hidden, active)
  _idproperty?: string; // ✅ Novo nome para ID externo do condomínio relacionado
  owner?: ProprietarioDetalhado; // Proprietário do imóvel (pode ser opcional)
}

// Tipo para os detalhes do condomínio obtidos na API Stays
export interface CondominioDetalhado {
  _id: string;          // ID externo do condomínio na Stays
  id: string;           // ID interno na Stays
  internalName: string; // Nome interno ou SKU do condomínio
  regiao: string;       // Região do condomínio
  status?: string;       // Status do condomínio (active, inactive, etc.)
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

// Tipo para os detalhes do proprietário obtidos na API Stays
export interface ProprietarioDetalhado {
  nome: string; // Nome do proprietário
  telefone?: string; // Telefone do proprietário (se disponível)
}

// Tipo para os detalhes do bloqueio obtidos na API Stays
export interface BloqueioDetalhado {
  _id: string;            // ID externo do bloqueio na Stays
  name: string;           // Nome do bloqueio (pode ser o identificador)
  checkIn: string;        // Data de check-in no formato YYYY-MM-DD
  horaCheckIn?: string;   // Hora de check-in no formato HH:mm (se disponível)
  checkOut: string;       // Data de check-out no formato YYYY-MM-DD
  horaCheckOut?: string;  // Hora de check-out no formato HH:mm (se disponível)
  notaInterna?: string;   // Nota interna associada ao bloqueio
  idImovelStays: string;  // ID externo do imóvel na Stays associado ao bloqueio
  imovelId?: number | null; // ID do imóvel relacionado no banco de dados (se já cadastrado)
}
