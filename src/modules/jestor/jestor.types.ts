import { Decimal } from "@prisma/client/runtime/library";

// Tipo para os atributos da tabela de agente no banco de dados
export interface typeAgente {
    id: number;
    idExterno: string;
    nome: string;
    //reservas: string | null;
}

// Tipo para os atributos da tabela de hospede no banco de dados
export interface typeHospede{
    id: number;
    idExterno: string;
    nomeCompleto: string;
    email: string | null;
    dataDeNascimento: string | null;
    telefone: string | null;
    cpf: string | null;
    documento: string | null;
    reservaId: number;
}

// Tipo para os atributos da tabela de reserva no banco de dados
export interface typeReserva {
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
    partnerCode: string | null;
    linkStays: string;
    idImovelStays: string; // ID do imóvel na Stays
    imovelId: number | null; // ID do imóvel relacionado no banco de dados
    canalId: number | null; // ID do canal relacionado no banco de dados
    origem: string; // Mantendo origem da reserva
    status: string;
    condominio: string;
    regiao: string;
    imovelOficialSku: string;
}

// Tipo para os atributos da tabela de canal no banco de dados
export interface typeCanal {
    id: number;
    idExterno: string;
    titulo: string;
}

// Tipo para os atributos da tabela de imóvel no banco de dados
export interface typeImovel {
    id: number;
    idExterno: string;
    idStays: string;
    sku: string | null;
    status: string;
    idCondominioStays: string | null;
}

// Tipo para os atributos da tabela de condomínio no banco de dados
export interface typeCondominio {
    id: number;
    idExterno: string;
    idStays: string;
    sku: string;
    regiao: string;
}

// Tipo para os atributos da tabela de taxaReserva no banco de dados
export interface typeTaxaReserva {
    id: number;
    reservaId: number;
    name: string;
    valor: number;
}
